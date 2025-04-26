import { rate_limiter } from '$lib/rate-limiter';
import type { InactiveFollow } from '$lib/types';
import type { AppBskyActorDefs, AtpAgent } from '@atproto/api';
import { differenceInHours } from 'date-fns';
import { batch_check_follows_back } from '../api';
import { handle_rate_limit_error } from '../api/rate-limit-handler';
import { get_cached_accounts_by_did } from '../db/account-cache';
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
	return follows.filter((follow) => {
		// Use differenceInHours for more accurate time comparison
		return differenceInHours(now, follow.lastPostDate) >= days * 24;
	});
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
			// First check if we have recent data in the database
			const cached_accounts = await get_cached_accounts_by_did(
				chunk.map((f) => f.did),
			);
			const cached_map = new Map(
				cached_accounts.map((a) => [a.did, a]),
			);

			// Filter out accounts that have recent data (less than 24 hours old)
			const accounts_needing_update = chunk.filter((account) => {
				const cached = cached_map.get(account.did);
				return (
					!cached ||
					!cached.last_checked ||
					differenceInHours(new Date(), cached.last_checked) >= 24
				);
			});

			// If we have accounts that need updating, process them with the API
			if (accounts_needing_update.length > 0) {
				const [profiles, follows_back_map] = await Promise.all([
					retry_with_backoff(() =>
						rate_limiter.add_to_queue(() =>
							agent.api.app.bsky.actor.getProfiles({
								actors: accounts_needing_update.map((f) => f.did),
							}),
						),
					),
					retry_with_backoff(() =>
						batch_check_follows_back(
							viewer_did,
							accounts_needing_update.map((f) => f.did),
						),
					),
				]);

				const activity_promises = accounts_needing_update.map(
					(follow, index) =>
						get_latest_activity(
							agent,
							follow.did,
							profiles.data.profiles[index].indexedAt,
							feed_options,
						),
				);

				const activity_dates = await Promise.all(activity_promises);

				const batch_results: InactiveFollow[] =
					accounts_needing_update.map((follow, i) => {
						const profile = profiles.data.profiles[i];
						const last_activity = activity_dates[i];

						return {
							did: follow.did,
							handle: follow.handle,
							displayName: follow.displayName,
							lastPost: last_activity.toISOString(),
							lastPostDate: last_activity,
							createdAt:
								profile.indexedAt || new Date(0).toISOString(),
							source: 'api' as const,
							follows_back: follows_back_map.get(follow.did) || false,
						};
					});

				results.push(...batch_results);

				await retry_with_backoff(() =>
					execute_batch_update(
						batch_results.map((result, index) => ({
							did: result.did,
							handle: result.handle,
							last_post_date: result.lastPost,
							post_count:
								profiles.data.profiles[index].postsCount || 0,
							followers_count:
								profiles.data.profiles[index].followersCount || null,
							follows_back: follows_back_map.get(result.did) || false,
						})),
					),
				);
			}

			// Add cached results for accounts with recent data
			const cached_results: InactiveFollow[] = chunk
				.filter((account) => {
					const cached = cached_map.get(account.did);
					return (
						cached &&
						cached.last_checked &&
						differenceInHours(new Date(), cached.last_checked) < 24
					);
				})
				.map((account) => {
					const cached = cached_map.get(account.did)!;
					return {
						did: account.did,
						handle: account.handle,
						displayName: account.displayName,
						lastPost: cached.last_post_date!.toISOString(),
						lastPostDate: cached.last_post_date!,
						createdAt: new Date(0).toISOString(), // We don't have this in cache
						source: 'cache' as const,
						follows_back: cached.follows_back,
					};
				});

			results.push(...cached_results);
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
					data_source:
						accounts_needing_update.length > 0 ? 'api' : 'cache',
					current_batch_source:
						accounts_needing_update.length > 0
							? 'Fetching fresh data from Bluesky API'
							: 'Using cached data',
					cache_hits: cache_stats?.hits || 0,
					cache_misses: cache_stats?.misses || 0,
				});
			}

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
