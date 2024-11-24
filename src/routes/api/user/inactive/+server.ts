import {
	cache_account_activity,
	get_cached_accounts_by_handles,
} from '$lib/db';
import { rate_limiter } from '$lib/rate-limiter';
import type { InactiveFollow } from '$lib/types';
import {
	AtpAgent,
	type AppBskyFeedGetAuthorFeed,
	type AppBskyGraphGetFollows,
} from '@atproto/api';
import { error } from '@sveltejs/kit';
import {
	differenceInDays,
	differenceInHours,
	parseISO,
} from 'date-fns';

const PUBLIC_API = 'https://public.api.bsky.app';
const agent = new AtpAgent({ service: PUBLIC_API });

const CACHE_TTL_HOURS = 6; // Cache data for 6 hours

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
		const handles_to_check: string[] = [];

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

			// Collect all handles first
			const current_handles = follows.data.follows.map(
				(f) => f.handle,
			);
			handles_to_check.push(...current_handles);

			// Get cached data for this batch
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
					differenceInHours(new Date(), cached.last_checked) <
						CACHE_TTL_HOURS
				) {
					// Use cached data
					last_post_date = cached.last_post_date || new Date(0);
					post_count = cached.post_count;
					processed++;
				} else {
					// Fetch fresh data
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

					post_count = latest_post.data.feed.length;

					// Cache the result
					await cache_account_activity(
						follow.did,
						follow.handle,
						last_post_date.toISOString(),
						post_count,
						follow.followerCount,
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

				const days_since_last_post = differenceInDays(
					new Date(),
					last_post_date,
				);

				follows_with_posts.push({
					...follow,
					lastPostDate: last_post_date,
					daysSinceLastPost: days_since_last_post,
				});
			}

			cursor = follows.data.cursor;
		} while (cursor);

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
