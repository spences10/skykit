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
const FEED_CHUNK_SIZE = 25;
const DELAY_BETWEEN_BATCHES = 500;
const MAX_RETRIES = 3;

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
	options: FeedOptions,
): Promise<Date> {
	try {
		// First check profile.indexedAt as it's more efficient
		const profile = await retry_with_backoff(() =>
			rate_limiter.add_to_queue(() =>
				agent.api.app.bsky.actor.getProfile({
					actor: did || '', // Ensure we always pass a string
				}),
			),
		);

		if (!profile?.data?.indexedAt) {
			return new Date(0);
		}

		const profile_indexed_at = parseISO(profile.data.indexedAt);

		// If profile was indexed recently, we can use that timestamp
		if (differenceInDays(new Date(), profile_indexed_at) < 30) {
			return profile_indexed_at;
		}

		// Otherwise, check actual posts with pagination
		let cursor: string | undefined;
		let most_recent_date = new Date(0);
		let attempts = 0;

		do {
			try {
				const posts = await rate_limiter.add_to_queue(() =>
					agent.api.app.bsky.feed.getAuthorFeed({
						actor: did,
						limit: options.limit,
						filter: options.filter,
						cursor,
					}),
				);

				if (posts.data.feed.length > 0) {
					for (const item of posts.data.feed) {
						const post_date = parseISO(item.post.indexedAt);
						if (post_date > most_recent_date) {
							most_recent_date = post_date;
						}
					}

					// If we found a recent post, we can stop paginating
					if (differenceInDays(new Date(), most_recent_date) < 30) {
						break;
					}
				}

				cursor = posts.data.cursor;
				attempts++;

				// Add delay between paginated requests
				if (cursor) {
					await new Promise((resolve) => setTimeout(resolve, 500));
				}
			} catch (error) {
				const api_error = error as ApiError;
				if (api_error.status === 429) {
					await handle_rate_limit_error(api_error);
					continue;
				}
				throw error;
			}
		} while (cursor && attempts < MAX_RETRIES);

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
		limit: 10,
	};

	for (const chunk of chunks) {
		try {
			// Get profiles for the chunk
			const profiles = await retry_with_backoff(() =>
				rate_limiter.add_to_queue(() =>
					agent.api.app.bsky.actor.getProfiles({
						actors: chunk.map((f) => f.did),
					}),
				),
			);

			// Batch check follows_back for the entire chunk
			const follows_back_map = await batch_check_follows_back(
				viewer_did,
				chunk.map((f) => f.did),
			);

			// Process each profile in the chunk
			const activity_promises = chunk.map((follow) =>
				get_latest_activity(agent, follow.did, feed_options),
			);

			const activity_dates = await Promise.all(activity_promises);

			// Process results
			for (let i = 0; i < chunk.length; i++) {
				const follow = chunk[i];
				const profile = profiles.data.profiles[i];
				const last_activity = activity_dates[i];

				results.push({
					did: follow.did,
					handle: follow.handle,
					displayName: follow.displayName,
					lastPost: last_activity.toISOString(),
					lastPostDate: last_activity,
					createdAt: profile.indexedAt || new Date(0).toISOString(),
					source: 'api',
					follows_back: follows_back_map.get(follow.did) || false,
				});

				processed++;
				if (controller) {
					report_progress(controller, {
						stage: 'profiles',
						processed,
						total: accounts.length,
						current: follow.handle,
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
			}

			// Update cache using consolidated batch update
			await execute_batch_update(
				chunk.map((follow, index) => ({
					did: follow.did,
					handle: follow.handle,
					last_post_date:
						results[results.length - chunk.length + index].lastPost,
					post_count: profiles.data.profiles[index].postsCount || 0,
					followers_count:
						profiles.data.profiles[index].followersCount || null,
					follows_back: follows_back_map.get(follow.did) || false,
				})),
			);

			await new Promise((resolve) =>
				setTimeout(resolve, DELAY_BETWEEN_BATCHES),
			);
		} catch (error) {
			const api_error = error as ApiError;
			if (api_error.status === 429) {
				await handle_rate_limit_error(api_error);
				// Retry this chunk
				chunks.unshift(chunk);
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
