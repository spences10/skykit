import {
	get_cached_accounts_by_handles,
	get_db,
	store_stat,
} from '$lib/db';
import { rate_limiter } from '$lib/rate-limiter';
import type { InactiveFollow } from '$lib/types';
import { AtpAgent } from '@atproto/api';
import { error } from '@sveltejs/kit';
import { differenceInDays, parseISO } from 'date-fns';
import type { AppBskyActorDefs } from '@atproto/api';

const PUBLIC_API = 'https://public.api.bsky.app';
const agent = new AtpAgent({ service: PUBLIC_API });

type SortOption = 'last_post' | 'handle';
type DbTransaction = Awaited<
	ReturnType<typeof get_db>
>['transaction'];

function chunk_array<T>(array: T[], size: number): T[][] {
	return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
		array.slice(i * size, i * size + size)
	);
}

async function execute_batch_update(updates: Array<{
	did: string;
	handle: string;
	last_post_date: string;
	post_count: number | null;
	followers_count: number | null;
}>) {
	const db = get_db();
	const tx = await db.transaction();
	try {
		for (const update of updates) {
			await tx.execute({
				sql: `
					INSERT INTO account_activity 
					(did, handle, last_post_date, last_checked, post_count, followers_count)
					VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?)
					ON CONFLICT(did) DO UPDATE SET
						last_post_date = EXCLUDED.last_post_date,
						last_checked = CURRENT_TIMESTAMP,
						post_count = EXCLUDED.post_count,
						followers_count = EXCLUDED.followers_count
				`,
				args: [
					update.did,
					update.handle,
					update.last_post_date,
					update.post_count,
					update.followers_count,
				],
			});
		}
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
		await new Promise(resolve => setTimeout(resolve, delay));
		return retry_with_backoff(operation, retries - 1, delay * 2);
	}
}

async function get_all_follows(
	agent: AtpAgent,
	did: string,
	total_follows: number,
	controller?: ReadableStreamDefaultController,
) {
	try {
		const follows_with_posts: Array<
			InactiveFollow & { lastPostDate: Date }
		> = [];
		let cursor: string | undefined;
		let processed = 0;
		let cache_hits = 0;
		const start_time = Date.now();
		let batch_updates: Array<{
			did: string;
			handle: string;
			last_post_date: string;
			post_count: number | null;
			followers_count: number | null;
		}> = [];
		const BATCH_SIZE = 100;

		if (controller) {
			const encoder = new TextEncoder();
			controller.enqueue(
				encoder.encode(
					`data: ${JSON.stringify({
						type: 'progress',
						processed: 0,
						total: total_follows,
						current: 'Starting...',
						average_time_per_item: 0,
					})}\n\n`,
				),
			);
		}

		do {
			const follows = await rate_limiter.add_to_queue(() =>
				agent.api.app.bsky.graph.getFollows({
					actor: did,
					limit: 100,
					cursor,
				}),
			);

			if (!follows.data.follows) break;

			const current_handles = follows.data.follows.map(
				(f) => f.handle,
			);
			const cached_accounts =
				await get_cached_accounts_by_handles(current_handles);
			const cached_map = new Map(
				cached_accounts.map((a) => [a.handle, a]),
			);

			// Filter accounts that need updating
			const accounts_to_update = follows.data.follows.filter(
				(follow) => !cached_map.has(follow.handle) ||
					differenceInDays(new Date(), cached_map.get(follow.handle)!.last_checked) >= 1
			);

			// Process cached accounts first
			follows.data.follows.forEach(follow => {
				const cached = cached_map.get(follow.handle);
				if (cached && differenceInDays(new Date(), cached.last_checked) < 1) {
					processed++;
					cache_hits++;

					// Report progress for cached items
					if (controller) {
						const encoder = new TextEncoder();
						const elapsed = (Date.now() - start_time) / 1000;
						const avg_time = elapsed / processed;

						controller.enqueue(
							encoder.encode(
								`data: ${JSON.stringify({
									type: 'progress',
									processed,
									total: total_follows,
									current: follow.handle,
									average_time_per_item: avg_time,
									cached: true,
								})}\n\n`,
							),
						);
					}

					follows_with_posts.push({
						did: follow.did,
						handle: follow.handle,
						displayName: follow.displayName,
						lastPost: cached.last_post_date?.toISOString() || new Date(0).toISOString(),
						lastPostDate: cached.last_post_date || new Date(0),
					});
				}
			});

			if (accounts_to_update.length > 0) {
				// Split into chunks of 25 for getProfiles
				const chunked_accounts = chunk_array(accounts_to_update, 25);
				const all_profiles: typeof accounts_to_update = [];

				// Get profiles in chunks with delay between chunks
				for (const chunk of chunked_accounts) {
					try {
						const profiles_chunk = await retry_with_backoff(() =>
							rate_limiter.add_to_queue(() =>
								agent.api.app.bsky.actor.getProfiles({
									actors: chunk.map(f => f.did)
								})
							)
						);
						all_profiles.push(...profiles_chunk.data.profiles);
						
						// Add small delay between chunks
						if (chunked_accounts.length > 1) {
							await new Promise(resolve => setTimeout(resolve, 500));
						}
					} catch (e) {
						console.error('Error fetching profiles chunk:', e);
						throw e;
					}
				}

				// Add type for feed response
				type FeedResponse = {
					data: {
						feed: Array<{
							post: {
								indexedAt: string;
							};
						}>;
					};
				};

				// Batch feed requests in smaller parallel groups
				const feed_chunks = chunk_array(accounts_to_update, 10);
				const all_feed_requests: FeedResponse[] = [];

				for (const chunk of feed_chunks) {
					try {
						const chunk_results = await retry_with_backoff(() =>
							Promise.all(
								chunk.map(follow =>
									rate_limiter.add_to_queue(() =>
										agent.api.app.bsky.feed.getAuthorFeed({
											actor: follow.did,
											limit: 1,
										})
									)
								)
							)
						);
						all_feed_requests.push(...chunk_results);
						
						// Add small delay between chunks
						if (feed_chunks.length > 1) {
							await new Promise(resolve => setTimeout(resolve, 500));
						}
					} catch (e) {
						console.error('Error fetching feed chunk:', e);
						throw e;
					}
				}

				// Process results and update progress
				accounts_to_update.forEach((follow, idx) => {
					const profile = all_profiles[idx] as AppBskyActorDefs.ProfileViewDetailed;
					const latest_post = all_feed_requests[idx].data.feed[0];
					processed++;

					// Report progress for fetched items
					if (controller) {
						const encoder = new TextEncoder();
						const elapsed = (Date.now() - start_time) / 1000;
						const avg_time = elapsed / processed;

						controller.enqueue(
							encoder.encode(
								`data: ${JSON.stringify({
									type: 'progress',
									processed,
									total: total_follows,
									current: follow.handle,
									average_time_per_item: avg_time,
									cached: false,
								})}\n\n`,
							),
						);
					}

					const last_post_date = latest_post
						? parseISO(latest_post.post.indexedAt)
						: new Date(0);

					batch_updates.push({
						did: follow.did,
						handle: follow.handle,
						last_post_date: last_post_date.toISOString(),
						post_count: typeof profile.postsCount === 'number' ? profile.postsCount : 0,
						followers_count: typeof profile.followersCount === 'number' ? profile.followersCount : null
					});

					follows_with_posts.push({
						did: follow.did,
						handle: follow.handle,
						displayName: follow.displayName,
						lastPost: last_post_date.toISOString(),
						lastPostDate: last_post_date,
					});
				});

				// Execute database batch if we've reached BATCH_SIZE
				if (batch_updates.length >= BATCH_SIZE) {
					await execute_batch_update(batch_updates);
					batch_updates = [];
				}
			}

			cursor = follows.data.cursor;
		} while (cursor);

		// Handle any remaining batch updates
		if (batch_updates.length > 0) {
			await execute_batch_update(batch_updates);
		}

		// Store stats
		const end_time = Date.now();
		const total_time = (end_time - start_time) / 1000;

		await store_stat('query_performance', {
			total_processed: processed,
			cache_hits,
			cache_misses: processed - cache_hits,
			total_time_seconds: total_time,
			average_time_per_item: total_time / processed,
			timestamp: new Date().toISOString(),
		});

		return follows_with_posts;
	} catch (e) {
		console.error('Error in get_all_follows:', e);
		throw e;
	}
}

function filter_inactive_follows(
	follows: Array<InactiveFollow & { lastPostDate: Date }>,
	days: number,
) {
	const now = new Date();
	return follows
		.filter(
			(follow) => differenceInDays(now, follow.lastPostDate) >= days,
		)
		.map(({ lastPostDate, ...follow }) => follow);
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
				const encoder = new TextEncoder();

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
