import { rate_limiter } from '#lib/rate-limiter.js';
import type { InactiveFollow } from '#lib/types.js';
import type { AtpAgent } from '@atproto/api';
import { differenceInHours } from 'date-fns';
import { batch_check_follows_back } from '../api';
import { handle_rate_limit_error } from '../api/rate-limit-handler';
import type { FollowSummary } from '../db/follow-list-cache';
import { store_follows_back } from '../db/follows-back-cache';
import { execute_batch_update } from '../inactive-process';
import {
	chunk_array,
	report_progress,
	retry_with_backoff,
} from '../utils';
import { get_latest_activity } from './activity-fetcher';
import {
	chunk_concurrency,
	feed_chunk_size,
	max_chunk_attempts,
	profile_chunk_size,
	type FeedOptions,
} from './constants';

export function filter_inactive_follows(
	follows: InactiveFollow[],
	days: number,
): InactiveFollow[] {
	const now = new Date();
	return follows.filter((follow) => {
		// Use differenceInHours for more accurate time comparison
		return differenceInHours(now, follow.last_post_date) >= days * 24;
	});
}

const feed_options: FeedOptions = {
	filter: 'posts_with_replies',
	limit: feed_chunk_size,
};

// Fetch activity, profiles and follows-back for one chunk and save it
async function process_chunk(
	viewer_did: string,
	chunk: FollowSummary[],
	agent: AtpAgent,
): Promise<InactiveFollow[]> {
	const dids = chunk.map((f) => f.did);
	const [profiles, follows_back_map, activity_dates] =
		await Promise.all([
			retry_with_backoff(() =>
				rate_limiter.add_to_queue(() =>
					agent.api.app.bsky.actor.getProfiles({ actors: dids }),
				),
			),
			retry_with_backoff(() =>
				batch_check_follows_back(viewer_did, dids),
			),
			Promise.all(
				dids.map((did) =>
					get_latest_activity(agent, did, feed_options),
				),
			),
		]);

	const profile_by_did = new Map(
		profiles.data.profiles.map((p) => [p.did, p]),
	);

	const batch_results: InactiveFollow[] = chunk.map((follow, i) => {
		const profile = profile_by_did.get(follow.did);
		const last_activity = activity_dates[i];
		return {
			did: follow.did,
			handle: follow.handle,
			displayName: follow.displayName,
			last_post: last_activity.toISOString(),
			last_post_date: last_activity,
			createdAt:
				profile?.createdAt ||
				profile?.indexedAt ||
				new Date(0).toISOString(),
			source: 'api' as const,
			follows_back: follows_back_map.get(follow.did) || false,
		};
	});

	await retry_with_backoff(() =>
		execute_batch_update(
			batch_results.map((result) => {
				const profile = profile_by_did.get(result.did);
				return {
					did: result.did,
					handle: result.handle,
					last_post_date: result.last_post,
					post_count: profile?.postsCount || 0,
					followers_count: profile?.followersCount || null,
					created_at:
						profile?.createdAt || profile?.indexedAt || null,
				};
			}),
		),
	);
	store_follows_back(viewer_did, follows_back_map);

	return batch_results;
}

async function process_chunk_with_retry(
	viewer_did: string,
	chunk: FollowSummary[],
	agent: AtpAgent,
): Promise<InactiveFollow[]> {
	for (let attempt = 1; ; attempt++) {
		try {
			return await process_chunk(viewer_did, chunk, agent);
		} catch (error: any) {
			if (attempt >= max_chunk_attempts) throw error;
			if (error?.status === 429) {
				await handle_rate_limit_error(error);
				continue;
			}
			if (error?.cause?.code === 'ETIMEDOUT' || error?.status === 1) {
				console.log('Network timeout processing chunk, retrying...');
				await new Promise((resolve) => setTimeout(resolve, 2000));
				continue;
			}
			throw error;
		}
	}
}

/** Fetch fresh data for accounts the caller found missing or stale in the cache. */
export async function process_accounts_in_chunks(
	viewer_did: string,
	accounts: FollowSummary[],
	agent: AtpAgent,
	controller?: ReadableStreamDefaultController,
	cache_stats?: { hits: number; misses: number },
	on_results?: (batch: InactiveFollow[]) => void,
): Promise<InactiveFollow[]> {
	const chunks = chunk_array(accounts, profile_chunk_size);
	const results: InactiveFollow[] = [];
	let processed = 0;
	let next_chunk = 0;

	// A few workers pull chunks off a shared index; the rate limiter
	// still caps concurrent AppView requests
	const worker = async () => {
		while (next_chunk < chunks.length) {
			const chunk = chunks[next_chunk++];
			const batch_results = await process_chunk_with_retry(
				viewer_did,
				chunk,
				agent,
			);
			results.push(...batch_results);
			on_results?.(batch_results);
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
		}
	};

	await Promise.all(
		Array.from(
			{ length: Math.min(chunk_concurrency, chunks.length) },
			worker,
		),
	);

	return results;
}
