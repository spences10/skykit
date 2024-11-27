import { get_db } from '$lib/db';
import { rate_limiter } from '$lib/rate-limiter';
import { execute_batch_update } from '$lib/server/inactive-process';
import type {
	CachedAccount,
	CacheStats,
	InactiveFollow,
	ProcessingStats,
} from '$lib/types';
import type { AppBskyActorDefs } from '@atproto/api';
import { AtpAgent } from '@atproto/api';
import { error } from '@sveltejs/kit';
import { differenceInDays, parseISO } from 'date-fns';

const PUBLIC_API = 'https://public.api.bsky.app';
const agent = new AtpAgent({ service: PUBLIC_API });
const CACHE_FRESHNESS_DAYS = 7;
const MAX_ACTORS_PER_REQUEST = 25;

function chunk_array<T>(array: T[], size: number): T[][] {
	return Array.from(
		{ length: Math.ceil(array.length / size) },
		(_, i) => array.slice(i * size, i * size + size),
	);
}

async function get_profile(handle: string) {
	return await rate_limiter.add_to_queue(() =>
		agent.api.app.bsky.actor.getProfile({
			actor: handle,
		}),
	);
}

async function retry_with_backoff<T>(
	operation: () => Promise<T>,
	retries = 3,
	delay = 1000,
): Promise<T> {
	try {
		return await operation();
	} catch (error) {
		if (retries === 0) throw error;
		await new Promise((resolve) => setTimeout(resolve, delay));
		return retry_with_backoff(operation, retries - 1, delay * 2);
	}
}

const report_progress = (
	controller: ReadableStreamDefaultController,
	stats: Partial<ProcessingStats>,
) => {
	const encoder = new TextEncoder();
	controller.enqueue(
		encoder.encode(
			`data: ${JSON.stringify({
				type: 'progress',
				...stats,
			})}\n\n`,
		),
	);
};

async function get_all_follows_for_user(
	agent: AtpAgent,
	did: string,
	total_follows: number,
	controller?: ReadableStreamDefaultController,
): Promise<AppBskyActorDefs.ProfileView[]> {
	const all_follows: AppBskyActorDefs.ProfileView[] = [];
	let cursor: string | undefined;

	do {
		const follows = await rate_limiter.add_to_queue(() =>
			agent.api.app.bsky.graph.getFollows({
				actor: did,
				limit: 100,
				cursor,
			}),
		);

		if (!follows.data.follows) break;
		all_follows.push(...follows.data.follows);
		cursor = follows.data.cursor;

		if (cursor) {
			await new Promise((resolve) => setTimeout(resolve, 500));
		}

		if (controller) {
			report_progress(controller, {
				stage: 'follows',
				processed: all_follows.length,
				total: total_follows,
				current: `Fetching follows: ${all_follows.length}/${total_follows}`,
				data_source: 'api',
				current_batch_source: 'Fetching follows from Bluesky API',
				cache_hits: 0,
				cache_misses: 0,
			});
		}
	} while (cursor);

	return all_follows;
}

async function get_profiles_in_chunks(
	dids: string[],
	controller?: ReadableStreamDefaultController,
): Promise<Map<string, AppBskyActorDefs.ProfileViewDetailed>> {
	const chunks = chunk_array(dids, MAX_ACTORS_PER_REQUEST);
	const profile_map = new Map<string, AppBskyActorDefs.ProfileViewDetailed>();
	let processed = 0;

	for (const chunk of chunks) {
		const profiles = await retry_with_backoff(() =>
			rate_limiter.add_to_queue(() =>
				agent.api.app.bsky.actor.getProfiles({
					actors: chunk,
				}),
			),
		);

		for (const profile of profiles.data.profiles) {
			profile_map.set(profile.did, profile);
		}

		processed += chunk.length;
		if (controller) {
			report_progress(controller, {
				stage: 'profiles',
				processed,
				total: dids.length,
				current: 'Fetching profile data...',
				data_source: 'api',
				current_batch_source: 'Fetching profiles from Bluesky API',
			});
		}

		// Add a small delay between chunks
		if (chunks.length > 1) {
			await new Promise((resolve) => setTimeout(resolve, 500));
		}
	}

	return profile_map;
}

async function process_accounts_in_chunks(
	accounts: AppBskyActorDefs.ProfileView[],
	controller?: ReadableStreamDefaultController,
	cache_stats?: { hits: number; misses: number },
): Promise<InactiveFollow[]> {
	const PROFILE_CHUNK_SIZE = 25;
	const FEED_CHUNK_SIZE = 15;
	const DELAY_BETWEEN_BATCHES = 500;

	const chunks = chunk_array(accounts, PROFILE_CHUNK_SIZE);
	const results: InactiveFollow[] = [];
	let processed = 0;

	for (const chunk of chunks) {
		const profiles = await retry_with_backoff(() =>
			rate_limiter.add_to_queue(() =>
				agent.api.app.bsky.actor.getProfiles({
					actors: chunk.map((f) => f.did),
				}),
			),
		);

		const feeds = await Promise.all(
			chunk_array(chunk, FEED_CHUNK_SIZE).map((feed_chunk) =>
				retry_with_backoff(() =>
					Promise.all(
						feed_chunk.map((follow) =>
							rate_limiter.add_to_queue(() =>
								agent.api.app.bsky.feed.getAuthorFeed({
									actor: follow.did,
									limit: 1,
								}),
							),
						),
					),
				),
			),
		);

		const flat_feeds = feeds.flat();

		// Process results
		chunk.forEach((follow, index) => {
			const profile = profiles.data.profiles[index];
			const feed = flat_feeds[index];
			const last_post_date = feed.data.feed[0]
				? parseISO(feed.data.feed[0].post.indexedAt)
				: new Date(0);

			results.push({
				did: follow.did,
				handle: follow.handle,
				displayName: follow.displayName,
				lastPost: last_post_date.toISOString(),
				lastPostDate: last_post_date,
				createdAt: profile.indexedAt || new Date(0).toISOString(),
				source: 'api',
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
		});

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
			})),
		);

		await new Promise((resolve) =>
			setTimeout(resolve, DELAY_BETWEEN_BATCHES),
		);
	}

	return results;
}

function filter_inactive_follows(
	follows: InactiveFollow[],
	days: number,
): InactiveFollow[] {
	const now = new Date();
	return follows.filter(
		(follow) => differenceInDays(now, follow.lastPostDate) >= days,
	);
}

async function get_cached_accounts_by_did(
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
			const result = await tx.execute({
				sql: `SELECT * FROM account_activity WHERE did IN (${placeholders})`,
				args: chunk,
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

async function get_all_follows(
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
				accounts_to_update,
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

export async function GET({ url }) {
	const handle = url.searchParams.get('handle');
	const days = parseInt(url.searchParams.get('days') || '30', 10);
	const stream = url.searchParams.get('stream') === 'true';

	if (!handle) {
		throw error(400, 'Missing handle parameter');
	}

	if (stream) {
		const { promise, resolve } = (() => {
			let resolve: (
				controller: ReadableStreamDefaultController,
			) => void;
			const promise = new Promise<ReadableStreamDefaultController>(
				(r) => {
					resolve = r;
				},
			);
			return { promise, resolve: resolve! };
		})();

		const stream = new ReadableStream({
			start(controller) {
				resolve(controller);
			},
			cancel() {
				console.log('Client disconnected');
			},
		});

		(async () => {
			try {
				const controller = await promise;
				const profile = await get_profile(handle);
				const total_follows = profile.data.followsCount || 0;

				const { results: all_follows, cache_stats } =
					await get_all_follows(
						agent,
						profile.data.did,
						total_follows,
						controller,
					);

				const inactive_follows = filter_inactive_follows(
					all_follows,
					days,
				);

				const encoder = new TextEncoder();
				controller.enqueue(
					encoder.encode(
						`data: ${JSON.stringify({
							type: 'complete',
							inactive_follows,
							cache_stats,
						})}\n\n`,
					),
				);
				controller.close();
			} catch (err) {
				console.error('Stream error:', err);
				const controller = await promise;
				controller.error(err);
			}
		})();

		return new Response(stream, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive',
			},
		});
	}

	// Non-streaming response
	try {
		const profile = await get_profile(handle);
		const total_follows = profile.data.followsCount || 0;

		const { results: all_follows, cache_stats } =
			await get_all_follows(agent, profile.data.did, total_follows);

		const inactive_follows = filter_inactive_follows(
			all_follows,
			days,
		);

		return Response.json({
			inactive_follows,
			total_follows,
			cache_stats,
		});
	} catch (err) {
		console.error('Error:', err);
		throw error(500, 'Failed to fetch inactive follows');
	}
}
