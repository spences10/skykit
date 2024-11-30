import { get_db } from '$lib/db';
import { rate_limiter } from '$lib/rate-limiter';
import { execute_batch_update } from '$lib/server/inactive-process';
import type { CachedAccount, InactiveFollow } from '$lib/types';
import type { AppBskyActorDefs, AtpAgent } from '@atproto/api';
import type { ResultSet, Value } from '@libsql/client';
import { differenceInDays, parseISO } from 'date-fns';
import { batch_check_follows_back } from './api';
import {
	chunk_array,
	report_progress,
	retry_with_backoff,
} from './utils';

const PROFILE_CHUNK_SIZE = 25;
const FEED_CHUNK_SIZE = 100;
const DELAY_BETWEEN_BATCHES = 100;
const RECENT_ACTIVITY_THRESHOLD = 30;

interface FeedOptions {
	filter:
		| 'posts_no_replies'
		| 'posts_with_replies'
		| 'posts_and_author_threads';
	limit: number;
}

interface ApiError extends Error {
	status?: number;
	headers?: {
		'retry-after'?: string;
	};
	cause?: {
		code?: string;
	};
}

async function handle_rate_limit_error(
	error: ApiError,
): Promise<void> {
	if (error?.status === 429) {
		const reset_after = parseInt(
			error?.headers?.['retry-after'] || '60',
			10,
		);
		await new Promise((resolve) =>
			setTimeout(resolve, reset_after * 1000),
		);
	} else {
		throw error;
	}
}

async function get_latest_activity(
	agent: AtpAgent,
	did: string,
	profile_indexed_at: string | undefined,
	options: FeedOptions,
): Promise<Date> {
	try {
		if (profile_indexed_at) {
			const indexed_date = parseISO(profile_indexed_at);
			if (
				differenceInDays(new Date(), indexed_date) <
				RECENT_ACTIVITY_THRESHOLD
			) {
				return indexed_date;
			}
		}

		const posts = await retry_with_backoff(() =>
			rate_limiter.add_to_queue(() =>
				agent.api.app.bsky.feed.getAuthorFeed({
					actor: did,
					limit: options.limit,
					filter: options.filter,
				}),
			),
		);

		let most_recent_date = new Date(0);

		if (posts.data.feed.length > 0) {
			for (const item of posts.data.feed) {
				const post_date = parseISO(item.post.indexedAt);
				if (post_date > most_recent_date) {
					most_recent_date = post_date;
				}
			}
		}

		return most_recent_date;
	} catch (error) {
		console.error(`Error fetching activity for ${did}:`, error);
		return new Date(0);
	}
}

export async function process_accounts_in_chunks(
	viewer_did: string,
	accounts: AppBskyActorDefs.ProfileView[],
	agent: AtpAgent,
	controller?: ReadableStreamDefaultController,
	cache_stats?: { hits: number; misses: number },
): Promise<InactiveFollow[]> {
	const chunks = chunk_array(accounts, PROFILE_CHUNK_SIZE);
	const results: InactiveFollow[] = [];
	let processed = 0;

	const feed_options: FeedOptions = {
		filter: 'posts_with_replies',
		limit: FEED_CHUNK_SIZE,
	};

	for (const chunk of chunks) {
		try {
			const [profiles, follows_back_map] = await Promise.all([
				retry_with_backoff(() =>
					rate_limiter.add_to_queue(() =>
						agent.api.app.bsky.actor.getProfiles({
							actors: chunk.map((f) => f.did),
						}),
					),
				),
				retry_with_backoff(() =>
					batch_check_follows_back(
						viewer_did,
						chunk.map((f) => f.did),
					),
				),
			]);

			const activity_promises = chunk.map((follow, index) =>
				get_latest_activity(
					agent,
					follow.did,
					profiles.data.profiles[index].indexedAt,
					feed_options,
				),
			);

			const activity_dates = await Promise.all(activity_promises);

			const batch_results: InactiveFollow[] = chunk.map(
				(follow, i) => {
					const profile = profiles.data.profiles[i];
					const last_activity = activity_dates[i];

					return {
						did: follow.did,
						handle: follow.handle,
						displayName: follow.displayName,
						lastPost: last_activity.toISOString(),
						lastPostDate: last_activity,
						createdAt: profile.indexedAt || new Date(0).toISOString(),
						source: 'api' as const,
						follows_back: follows_back_map.get(follow.did) || false,
					};
				},
			);

			results.push(...batch_results);
			processed += chunk.length;

			if (controller) {
				report_progress(controller, {
					stage: 'profiles',
					processed,
					total: accounts.length,
					current: chunk[chunk.length - 1].handle,
					batch_progress: {
						current: processed,
						total: accounts.length,
					},
					data_source: 'api',
					current_batch_source:
						'Fetching fresh data from Bluesky API',
					cache_hits: cache_stats?.hits || 0,
					cache_misses: cache_stats?.misses || 0,
				});
			}

			await retry_with_backoff(() =>
				execute_batch_update(
					batch_results.map((result, index) => ({
						did: result.did,
						handle: result.handle,
						last_post_date: result.lastPost,
						post_count: profiles.data.profiles[index].postsCount || 0,
						followers_count:
							profiles.data.profiles[index].followersCount || null,
						follows_back: follows_back_map.get(result.did) || false,
					})),
				),
			);

			if (chunks.length > 1) {
				await new Promise((resolve) =>
					setTimeout(resolve, DELAY_BETWEEN_BATCHES),
				);
			}
		} catch (error: any) {
			const api_error = error as ApiError;
			if (api_error.status === 429) {
				await handle_rate_limit_error(api_error);
				chunks.unshift(chunk);
				continue;
			}

			if (
				api_error?.cause?.code === 'ETIMEDOUT' ||
				api_error?.status === 1
			) {
				console.log(`Network timeout processing chunk, retrying...`);
				chunks.unshift(chunk);
				await new Promise((resolve) => setTimeout(resolve, 2000));
				continue;
			}

			throw error;
		}
	}

	return results;
}

export function filter_inactive_follows(
	follows: InactiveFollow[],
	days: number,
): InactiveFollow[] {
	const now = new Date();
	return follows.filter(
		(follow) => differenceInDays(now, follow.lastPostDate) >= days,
	);
}

export async function get_cached_accounts_by_did(
	dids: string[],
): Promise<CachedAccount[]> {
	if (dids.length === 0) return [];

	const client = get_db();
	const CHUNK_SIZE = 1000;
	const all_results: CachedAccount[] = [];

	try {
		const tx = await client.transaction();

		for (const chunk of chunk_array(dids, CHUNK_SIZE)) {
			const placeholders = chunk.map(() => '?').join(',');
			const result: ResultSet = await tx.execute({
				sql: `SELECT * FROM account_activity WHERE did IN (${placeholders})`,
				args: chunk as Value[],
			});

			const chunk_results = result.rows.map((row) => ({
				did: row.did as string,
				handle: row.handle as string,
				last_post_date: row.last_post_date
					? new Date(row.last_post_date as string)
					: null,
				last_checked: new Date(row.last_checked as string),
				post_count: row.post_count as number | null,
				followers_count: row.followers_count as number | null,
				follows_back: Boolean(row.follows_back),
			}));

			all_results.push(...chunk_results);
		}

		await tx.commit();
		return all_results;
	} catch (e) {
		console.error('Error fetching cached accounts:', e);
		throw e;
	}
}
