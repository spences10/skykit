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

interface CachedFollows {
	follows: Array<InactiveFollow & { lastPostDate: Date }>;
	timestamp: number;
}

const follows_cache = new Map<string, CachedFollows>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
		const follows_with_posts = [];
		let cursor: string | undefined;
		let processed = 0;
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

			for (const follow of follows.data.follows) {
				const latest_post = (await rate_limiter.add_to_queue(() =>
					agent.api.app.bsky.feed.getAuthorFeed({
						actor: follow.did,
						limit: 1,
					}),
				)) as AppBskyFeedGetAuthorFeed.Response;

				processed++;

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
						})}\n\n`,
					);
					controller.enqueue(progress);
				}

				const last_post_date = latest_post.data.feed[0]
					? parseISO(latest_post.data.feed[0].post.indexedAt)
					: new Date(0);

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

		return follows_with_posts;
	} catch (err) {
		console.error('Error fetching follows:', err);
		return [];
	}
}

function get_cached_data(handle: string, days: number) {
	const cached = follows_cache.get(handle);
	const now = new Date();

	if (cached && now.getTime() - cached.timestamp < CACHE_TTL) {
		return cached.follows
			.filter(
				(follow) =>
					differenceInDays(now, follow.lastPostDate) >= days,
			)
			.map(({ lastPostDate, ...follow }) => follow);
	}

	return null;
}

function cache_follows(
	handle: string,
	follows: Array<InactiveFollow & { lastPostDate: Date }>,
) {
	const now = new Date();
	follows_cache.set(handle, {
		follows,
		timestamp: now.getTime(),
	});

	// Clean up old cache entries
	for (const [key, value] of follows_cache) {
		if (now.getTime() - value.timestamp > CACHE_TTL) {
			follows_cache.delete(key);
		}
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

function sort_follows(
	follows: InactiveFollow[],
	sort: SortOption = 'last_post',
): InactiveFollow[] {
	return [...follows].sort((a, b) => {
		switch (sort) {
			case 'last_post':
				return (
					new Date(a.lastPost).getTime() -
					new Date(b.lastPost).getTime()
				);
			case 'handle':
				return a.handle.localeCompare(b.handle);
			default:
				return 0;
		}
	});
}

function handle_error(err: any) {
	console.error('Error:', err);
	throw error(500, 'Failed to fetch inactive follows');
}

export const GET = async ({ url }: { url: URL }) => {
	const handle = url.searchParams.get('handle');
	const days = Number(url.searchParams.get('days')) || 30;
	const sort =
		(url.searchParams.get('sort') as SortOption) || 'last_post';
	const stream = url.searchParams.get('stream') === 'true';

	if (!handle) {
		throw error(400, 'Handle is required');
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

				const total_follows = profile.data.followsCount ?? 0;

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
		const cached_data = get_cached_data(handle, days);
		if (cached_data) {
			return Response.json({
				inactive_follows: sort_follows(cached_data, sort),
				cache: 'hit',
			});
		}

		const profile = await get_profile(handle);
		const total_follows = profile.data.followsCount ?? 0;

		const all_follows = await get_all_follows(
			agent,
			profile.data.did,
			total_follows,
		);

		cache_follows(handle, all_follows);

		const inactive_follows = filter_inactive_follows(
			all_follows,
			days,
		);

		return Response.json({
			inactive_follows: sort_follows(inactive_follows, sort),
			cache: 'miss',
		});
	} catch (err) {
		handle_error(err);
	}
};
