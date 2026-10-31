import {
	batch_check_follows_back,
	get_all_follows_for_user,
	get_profiles_in_chunks,
} from '#lib/server/api.js';
import {
	get_cached_accounts_by_did,
	process_accounts_in_chunks,
} from '#lib/server/data-processor.js';
import { store_created_at } from '#lib/server/db/account-cache.js';
import {
	get_cached_follow_list,
	store_follow_list,
	type FollowSummary,
} from '#lib/server/db/follow-list-cache.js';
import {
	get_cached_follows_back,
	store_follows_back,
} from '#lib/server/db/follows-back-cache.js';
import { report_progress } from '#lib/server/utils.js';
import type {
	CacheStats,
	CachedAccount,
	InactiveFollow,
} from '#lib/types.js';
import type { AtpAgent } from '@atproto/api';
import { differenceInDays } from 'date-fns';
import type { ReadableStreamDefaultController } from 'node:stream/web';

const cache_freshness_days = 7;

async function get_follow_list(
	agent: AtpAgent,
	did: string,
	total_follows: number,
	controller?: ReadableStreamDefaultController,
): Promise<FollowSummary[]> {
	const cached = get_cached_follow_list(did);
	if (cached) return cached;

	const follows = await get_all_follows_for_user(
		agent,
		did,
		total_follows,
		controller,
	);
	store_follow_list(did, follows);
	return follows;
}

type CacheHit = { follow: FollowSummary; cached: CachedAccount };

function to_cached_result(
	follow: FollowSummary,
	cached: CachedAccount,
	created_at: string | null | undefined,
	follows_back: boolean,
): InactiveFollow {
	const last_post_date = cached.last_post_date ?? new Date(0);
	return {
		did: follow.did,
		handle: follow.handle,
		displayName: follow.displayName,
		last_post: last_post_date.toISOString(),
		last_post_date,
		createdAt: created_at || new Date(0).toISOString(),
		source: 'cache',
		follows_back,
	};
}

// Cached accounts missing a joined date or a follows-back value for this
// viewer: fetch only the missing part, save it, and build the results
async function complete_cached_hits(
	viewer_did: string,
	hits: CacheHit[],
	follows_back: Map<string, boolean>,
	controller?: ReadableStreamDefaultController,
): Promise<InactiveFollow[]> {
	const need_profile = hits
		.filter((h) => !h.cached.created_at)
		.map((h) => h.follow.did);
	const need_follows_back = hits
		.filter((h) => !follows_back.has(h.follow.did))
		.map((h) => h.follow.did);

	const [profile_map, fetched_follows_back] = await Promise.all([
		get_profiles_in_chunks(need_profile, controller),
		batch_check_follows_back(viewer_did, need_follows_back),
	]);

	const created_by_did = new Map<string, string>();
	for (const [did, profile] of profile_map) {
		const created_at = profile.createdAt || profile.indexedAt;
		if (created_at) created_by_did.set(did, created_at);
	}
	store_created_at(
		[...created_by_did].map(([did, created_at]) => ({
			did,
			created_at,
		})),
	);
	store_follows_back(viewer_did, fetched_follows_back);

	return hits.map((h) =>
		to_cached_result(
			h.follow,
			h.cached,
			h.cached.created_at || created_by_did.get(h.follow.did),
			follows_back.get(h.follow.did) ??
				fetched_follows_back.get(h.follow.did) ??
				false,
		),
	);
}

export async function get_all_follows(
	agent: AtpAgent,
	did: string,
	total_follows: number,
	controller?: ReadableStreamDefaultController,
	on_results?: (batch: InactiveFollow[]) => void,
): Promise<{ results: InactiveFollow[]; cache_stats: CacheStats }> {
	try {
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

		const all_follows = await get_follow_list(
			agent,
			did,
			total_follows,
			controller,
		);

		const cached_accounts = await get_cached_accounts_by_did(
			all_follows.map((f) => f.did),
		);
		const cached_map = new Map(
			cached_accounts.map((a) => [a.did, a]),
		);

		// Split follows into fresh cache hits and accounts to fetch
		const now = new Date();
		const hits: CacheHit[] = [];
		const accounts_to_update: FollowSummary[] = [];
		for (const follow of all_follows) {
			const cached = cached_map.get(follow.did);
			const is_fresh =
				cached?.last_post_date &&
				differenceInDays(now, cached.last_checked) <
					cache_freshness_days;
			if (cached && is_fresh) hits.push({ follow, cached });
			else accounts_to_update.push(follow);
		}

		const cache_hits = hits.length;
		const cache_misses = accounts_to_update.length;
		const cache_stats: CacheStats = {
			total_processed: all_follows.length,
			cache_hits,
			cache_misses,
			hit_rate: Number(
				((cache_hits / (all_follows.length || 1)) * 100).toFixed(2),
			),
		};

		// Hits with everything stored go out straight away
		const follows_back = get_cached_follows_back(
			did,
			hits.map((h) => h.follow.did),
		);
		const is_complete = (h: CacheHit) =>
			Boolean(h.cached.created_at) && follows_back.has(h.follow.did);
		const results: InactiveFollow[] = hits
			.filter(is_complete)
			.map((h) =>
				to_cached_result(
					h.follow,
					h.cached,
					h.cached.created_at,
					follows_back.get(h.follow.did)!,
				),
			);
		if (results.length > 0) on_results?.([...results]);

		if (controller) {
			report_progress(controller, {
				stage: 'cache',
				processed: cache_hits,
				total: all_follows.length,
				current: `${cache_hits} accounts from cache`,
				cache_hits,
				cache_misses,
				data_source: 'cache',
				current_batch_source: 'Reading from database...',
			});
		}

		const incomplete = hits.filter((h) => !is_complete(h));
		if (incomplete.length > 0) {
			const completed = await complete_cached_hits(
				did,
				incomplete,
				follows_back,
				controller,
			);
			results.push(...completed);
			on_results?.(completed);
		}

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

			const fresh_data = await process_accounts_in_chunks(
				did,
				accounts_to_update,
				agent,
				controller,
				{ hits: cache_hits, misses: cache_misses },
				on_results,
			);
			results.push(...fresh_data);
		}

		return { results, cache_stats };
	} catch (e) {
		console.error('Error in get_all_follows:', e);
		throw e;
	}
}
