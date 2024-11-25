import { get_cached_accounts_by_handles, get_db } from '$lib/db';
import { rate_limiter } from '$lib/rate-limiter';
import type { InactiveFollow, ProcessingStats } from '$lib/types';
import type { AppBskyActorDefs } from '@atproto/api';
import { AtpAgent } from '@atproto/api';
import { error } from '@sveltejs/kit';
import { differenceInDays, parseISO } from 'date-fns';

const PUBLIC_API = 'https://public.api.bsky.app';
const agent = new AtpAgent({ service: PUBLIC_API });

type SortOption = 'last_post' | 'handle';
type DbTransaction = Awaited<
	ReturnType<typeof get_db>
>['transaction'];

function chunk_array<T>(array: T[], size: number): T[][] {
	return Array.from(
		{ length: Math.ceil(array.length / size) },
		(_, i) => array.slice(i * size, i * size + size),
	);
}

async function execute_batch_update(
	updates: Array<{
		did: string;
		handle: string;
		last_post_date: string;
		post_count: number | null;
		followers_count: number | null;
	}>,
) {
	const db = get_db();
	const tx = await db.transaction();
	try {
		const placeholders = updates
			.map(() => '(?, ?, ?, CURRENT_TIMESTAMP, ?, ?)')
			.join(',');

		const args = updates.flatMap((u) => [
			u.did,
			u.handle,
			u.last_post_date,
			u.post_count,
			u.followers_count,
		]);

		await tx.execute({
			sql: `
				INSERT INTO account_activity 
				(did, handle, last_post_date, last_checked, post_count, followers_count)
				VALUES ${placeholders}
				ON CONFLICT(did) DO UPDATE SET
					last_post_date = EXCLUDED.last_post_date,
					last_checked = CURRENT_TIMESTAMP,
					post_count = EXCLUDED.post_count,
					followers_count = EXCLUDED.followers_count
			`,
			args,
		});
		await tx.commit();
	} catch (e) {
		await tx.rollback();
		throw e;
	}
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
			});
		}
	} while (cursor);

	return all_follows;
}

async function process_accounts_in_chunks(
	accounts: AppBskyActorDefs.ProfileView[],
	controller?: ReadableStreamDefaultController,
): Promise<InactiveFollow[]> {
	const BATCH_SIZE = 500;
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
				});
			}
		});

		// Update cache
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

function sort_follows(follows: InactiveFollow[], sort: SortOption) {
	return [...follows].sort((a, b) => {
		if (sort === 'last_post') {
			return (
				new Date(b.lastPost).getTime() -
				new Date(a.lastPost).getTime()
			);
		}
		return a.handle.localeCompare(b.handle);
	});
}

async function get_all_follows(
	agent: AtpAgent,
	did: string,
	total_follows: number,
	controller?: ReadableStreamDefaultController,
) {
	try {
		// Report initial state
		if (controller) {
			report_progress(controller, {
				stage: 'follows',
				processed: 0,
				total: total_follows,
				current: 'Checking cached data...',
				start_time: new Date(),
				cache_hits: 0,
				cache_misses: 0,
			});
		}

		// First, get all follows from API (we need this to know what to check)
		const all_follows = await get_all_follows_for_user(
			agent,
			did,
			total_follows,
			controller,
		);
		const all_handles = all_follows.map((f) => f.handle);

		// Check cache first
		const cached_accounts =
			await get_cached_accounts_by_handles(all_handles);
		const cached_map = new Map(
			cached_accounts.map((a) => [a.handle, a]),
		);

		// Process cached results
		const results: InactiveFollow[] = [];
		let cache_hits = 0;
		let cache_misses = 0;

		all_follows.forEach((follow) => {
			const cached = cached_map.get(follow.handle);
			const is_fresh_cache =
				cached &&
				differenceInDays(new Date(), cached.last_checked) < 1;

			if (is_fresh_cache) {
				cache_hits++;
				results.push({
					did: follow.did,
					handle: follow.handle,
					displayName: follow.displayName,
					lastPost:
						cached.last_post_date?.toISOString() ||
						new Date(0).toISOString(),
					lastPostDate: cached.last_post_date || new Date(0),
				});
			} else {
				cache_misses++;
			}
		});

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
				});
			}

			// Process accounts needing updates in chunks
			const fresh_data = await process_accounts_in_chunks(
				accounts_to_update,
				controller,
			);

			// Add fresh data to results
			results.push(...fresh_data);
		}

		return results;
	} catch (e) {
		console.error('Error in get_all_follows:', e);
		throw e;
	}
}

export async function GET({ url }) {
	const handle = url.searchParams.get('handle');
	const days = parseInt(url.searchParams.get('days') || '30', 10);
	const sort =
		(url.searchParams.get('sort') as SortOption) || 'last_post';
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

				const all_follows = await get_all_follows(
					agent,
					profile.data.did,
					total_follows,
					controller,
				);

				const inactive_follows = filter_inactive_follows(
					all_follows,
					days,
				);
				const sorted_follows = sort_follows(inactive_follows, sort);

				const encoder = new TextEncoder();
				controller.enqueue(
					encoder.encode(
						`data: ${JSON.stringify({
							type: 'complete',
							inactive_follows: sorted_follows,
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

		const all_follows = await get_all_follows(
			agent,
			profile.data.did,
			total_follows,
		);

		const inactive_follows = filter_inactive_follows(
			all_follows,
			days,
		);
		const sorted_follows = sort_follows(inactive_follows, sort);

		return Response.json({
			inactive_follows: sorted_follows,
			total_follows,
		});
	} catch (err) {
		console.error('Error:', err);
		throw error(500, 'Failed to fetch inactive follows');
	}
}
