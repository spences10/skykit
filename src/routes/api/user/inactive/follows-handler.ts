import {
	get_all_follows_for_user,
	get_profiles_in_chunks,
} from '$lib/server/api';
import {
	get_cached_accounts_by_did,
	process_accounts_in_chunks,
} from '$lib/server/data-processor';
import { report_progress } from '$lib/server/utils';
import type { CacheStats, InactiveFollow } from '$lib/types';
import type { AtpAgent } from '@atproto/api';
import { differenceInDays } from 'date-fns';
import type { ReadableStreamDefaultController } from 'node:stream/web';

const CACHE_FRESHNESS_DAYS = 7;

export async function get_all_follows(
	agent: AtpAgent,
	did: string,
	total_follows: number,
	controller?: ReadableStreamDefaultController,
): Promise<{ results: InactiveFollow[]; cache_stats: CacheStats }> {
	try {
		// Report initial state
		if (controller) {
			report_progress(controller, {
				stage: 'cache',
				processed: 0,
				total: total_follows,
				current: 'Checking cached data...',
				start_time: new Date(),
				cache_hits: 0,
				cache_misses: 0,
				data_source: 'cache',
				current_batch_source: 'Reading from database...',
			});
		}

		// First, get all follows from API (we need this to know what to check)
		const all_follows = await get_all_follows_for_user(
			agent,
			did,
			total_follows,
			controller,
		);

		// Get cached accounts by DID (primary key)
		const cached_accounts = await get_cached_accounts_by_did(
			all_follows.map((f) => f.did),
		);
		const cached_map = new Map(
			cached_accounts.map((a) => [a.did, a]),
		);

		// Get profiles for all follows to get creation dates (in chunks)
		const profile_map = await get_profiles_in_chunks(
			all_follows.map((f) => f.did),
			controller,
		);

		// Process cached results
		const results: InactiveFollow[] = [];
		let cache_hits = 0;
		let cache_misses = 0;
		let processed = 0;

		for (const follow of all_follows) {
			const cached = cached_map.get(follow.did);
			const profile = profile_map.get(follow.did);
			const is_fresh_cache =
				cached &&
				cached.last_checked &&
				differenceInDays(new Date(), cached.last_checked) <
					CACHE_FRESHNESS_DAYS;

			processed++;
			if (controller) {
				report_progress(controller, {
					stage: 'cache',
					processed,
					total: total_follows,
					current: follow.handle,
					cache_hits,
					cache_misses,
					data_source: 'cache',
					current_batch_source: 'Reading from database...',
				});
			}

			if (is_fresh_cache && cached && cached.last_post_date) {
				cache_hits++;
				results.push({
					did: follow.did,
					handle: follow.handle,
					displayName: follow.displayName,
					lastPost: cached.last_post_date.toISOString(),
					lastPostDate: cached.last_post_date,
					createdAt: profile?.indexedAt || new Date(0).toISOString(),
					source: 'cache',
					follows_back: cached.follows_back,
				});
			} else {
				cache_misses++;
			}
		}

		const cache_stats: CacheStats = {
			total_processed: processed,
			cache_hits,
			cache_misses,
			hit_rate: Number(((cache_hits / processed) * 100).toFixed(2)),
		};

		// Only process accounts that need updating
		const accounts_to_update = all_follows.filter(
			(follow) => !results.some((r) => r.did === follow.did),
		);

		if (accounts_to_update.length > 0) {
			if (controller) {
				report_progress(controller, {
					stage: 'profiles',
					processed: 0,
					total: accounts_to_update.length,
					current: 'Fetching fresh data...',
					cache_hits,
					cache_misses,
					data_source: 'api',
					current_batch_source:
						'Fetching fresh data from Bluesky API',
				});
			}

			// Process accounts needing updates in chunks
			const fresh_data = await process_accounts_in_chunks(
				did,
				accounts_to_update,
				agent,
				controller,
				{ hits: cache_hits, misses: cache_misses },
			);

			// Add fresh data to results
			results.push(...fresh_data);
		}

		return { results, cache_stats };
	} catch (e) {
		console.error('Error in get_all_follows:', e);
		throw e;
	}
}
