import { rate_limiter } from '$lib/rate-limiter';
import type { InactiveFollow } from '$lib/types';
import type { AppBskyActorDefs, AtpAgent } from '@atproto/api';
import { differenceInDays } from 'date-fns';
import { batch_check_follows_back } from '../api';
import { handle_rate_limit_error } from '../api/rate-limit-handler';
import { execute_batch_update } from '../inactive-process';
import {
	chunk_array,
	report_progress,
	retry_with_backoff,
} from '../utils';
import { get_latest_activity } from './activity-fetcher';
import {
	DELAY_BETWEEN_BATCHES,
	FEED_CHUNK_SIZE,
	PROFILE_CHUNK_SIZE,
	type FeedOptions,
} from './constants';

export function filter_inactive_follows(
	follows: InactiveFollow[],
	days: number,
): InactiveFollow[] {
	const now = new Date();
	return follows.filter(
		(follow) => differenceInDays(now, follow.lastPostDate) >= days,
	);
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
			const api_error = error;
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
