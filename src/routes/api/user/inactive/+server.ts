import {
	cache_account_activity,
	get_cached_accounts_by_handles,
	store_stat,
} from '$lib/db';
import { rate_limiter } from '$lib/rate-limiter';
import type { InactiveFollow } from '$lib/types';
import {
	AtpAgent,
	type AppBskyFeedGetAuthorFeed,
	type AppBskyGraphGetFollows,
} from '@atproto/api';
import { error } from '@sveltejs/kit';
import { differenceInDays, parseISO } from 'date-fns';

const PUBLIC_API = 'https://public.api.bsky.app';
const agent = new AtpAgent({ service: PUBLIC_API });

type SortOption = 'last_post' | 'handle';

async function get_profile(handle: string) {
	return await rate_limiter.add_to_queue(() =>
		agent.api.app.bsky.actor.getProfile({
			actor: handle,
		}),
	);
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
			const follows = (await rate_limiter.add_to_queue(() =>
				agent.api.app.bsky.graph.getFollows({
					actor: did,
					limit: 100,
					cursor,
				}),
			)) as AppBskyGraphGetFollows.Response;

			if (!follows.data.follows) break;

			// Get cached data for this batch
			const current_handles = follows.data.follows.map(
				(f) => f.handle,
			);
			const cached_accounts =
				await get_cached_accounts_by_handles(current_handles);
			const cached_map = new Map(
				cached_accounts.map((a) => [a.handle, a]),
			);

			for (const follow of follows.data.follows) {
				const cached = cached_map.get(follow.handle);
				let last_post_date: Date;
				let post_count: number | null = null;

				if (
					cached &&
					differenceInDays(new Date(), cached.last_checked) < 1
				) {
					// Use cached data
					last_post_date = cached.last_post_date || new Date(0);
					post_count = cached.post_count;
					processed++;
					cache_hits++;
				} else {
					// Get profile first for accurate post count
					const profile = await rate_limiter.add_to_queue(() =>
						agent.api.app.bsky.actor.getProfile({
							actor: follow.did,
						}),
					);

					// Then get latest post
					const latest_post = (await rate_limiter.add_to_queue(() =>
						agent.api.app.bsky.feed.getAuthorFeed({
							actor: follow.did,
							limit: 1,
						}),
					)) as AppBskyFeedGetAuthorFeed.Response;

					processed++;

					last_post_date = latest_post.data.feed[0]
						? parseISO(latest_post.data.feed[0].post.indexedAt)
						: new Date(0);

					post_count = profile.data.postsCount || 0;

					// Cache the result with follower count
					await cache_account_activity(
						follow.did,
						follow.handle,
						last_post_date.toISOString(),
						post_count,
						profile.data.followersCount || null,
					);
				}

				if (controller) {
					const encoder = new TextEncoder();
					const elapsed = (Date.now() - start_time) / 1000;
					const avg_time = elapsed / processed;

					const progress = encoder.encode(
						`data: ${JSON.stringify({
							type: 'progress',
							processed,
							total: total_follows,
							current: follow.handle,
							average_time_per_item: avg_time,
							cached: !!cached,
						})}\n\n`,
					);
					controller.enqueue(progress);
				}

				follows_with_posts.push({
					did: follow.did,
					handle: follow.handle,
					displayName: follow.displayName,
					lastPost: last_post_date.toISOString(),
					lastPostDate: last_post_date,
				});
			}

			cursor = follows.data.cursor;
		} while (cursor);

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
