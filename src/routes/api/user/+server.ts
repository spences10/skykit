import { generate_insights } from '$lib/bsky/insights';
import { Cache } from '$lib/cache';
import { rate_limiter } from '$lib/rate-limiter';
import type { BskyProfile } from '$lib/types';
import type { AppBskyActorDefs, AppBskyFeedDefs } from '@atproto/api';
import { AtpAgent } from '@atproto/api';
import { error } from '@sveltejs/kit';

const PUBLIC_API = 'https://public.api.bsky.app';
const agent = new AtpAgent({ service: PUBLIC_API });

// Separate caches for different types of data with different TTLs
const profile_cache = new Cache(5); // 5 minutes for profiles
const feed_cache = new Cache(2); // 2 minutes for feeds
const insights_cache = new Cache(10); // 10 minutes for insights

function ensure_profile_fields(
	profile: AppBskyActorDefs.ProfileViewDetailed,
): BskyProfile {
	return {
		did: profile.did,
		handle: profile.handle,
		displayName: profile.displayName || profile.handle,
		description: profile.description,
		avatar: profile.avatar,
		banner: profile.banner,
		followersCount: profile.followersCount || 0,
		followsCount: profile.followsCount || 0,
		postsCount: profile.postsCount || 0,
		indexedAt: profile.indexedAt || new Date().toISOString(),
	};
}

async function get_all_posts(
	handle: string,
): Promise<AppBskyFeedDefs.FeedViewPost[]> {
	let all_posts: AppBskyFeedDefs.FeedViewPost[] = [];
	let cursor: string | undefined = undefined;

	do {
		const response = await rate_limiter.add_to_queue(() =>
			agent.api.app.bsky.feed.getAuthorFeed({
				actor: handle,
				limit: 100, // Max limit per request
				cursor,
			}),
		);

		all_posts = [...all_posts, ...response.data.feed];
		cursor = response.data.cursor;
	} while (cursor); // Continue until no more cursor is returned

	return all_posts;
}

export const GET = async ({ url }) => {
	const handle = url.searchParams.get('handle');
	const full_analysis =
		url.searchParams.get('full_analysis') === 'true';

	if (!handle) {
		throw error(400, 'Handle is required');
	}

	try {
		// For full analysis, bypass cache and get all posts
		if (full_analysis) {
			const [posts, profile_response] = await Promise.all([
				get_all_posts(handle),
				rate_limiter.add_to_queue(() =>
					agent.api.app.bsky.actor.getProfile({
						actor: handle,
					}),
				),
			]);

			if (!profile_response.data) {
				throw error(404, 'Profile not found');
			}

			const profile = ensure_profile_fields(profile_response.data);
			const insights = generate_insights(
				posts,
				profile,
				full_analysis,
			);

			return Response.json({
				profile,
				...insights,
				cache_status: {
					profile: 'bypass',
					feed: 'bypass',
					insights: 'bypass',
				},
			});
		}

		// Regular flow with caching for initial view
		const cached_profile = profile_cache.get(handle);
		const cached_feed = feed_cache.get(handle);
		const cached_insights = insights_cache.get(handle);

		if (cached_profile && cached_feed && cached_insights) {
			return Response.json({
				profile: cached_profile,
				...cached_insights,
				cache_status: {
					profile: 'hit',
					feed: 'hit',
					insights: 'hit',
				},
			});
		}

		// Fetch initial data (first 100 posts)
		const [feed_response, profile_response] = await Promise.all([
			rate_limiter.add_to_queue(() =>
				agent.api.app.bsky.feed.getAuthorFeed({
					actor: handle,
					limit: 100,
				}),
			),
			rate_limiter.add_to_queue(() =>
				agent.api.app.bsky.actor.getProfile({
					actor: handle,
				}),
			),
		]);

		if (!profile_response.data) {
			throw error(404, 'Profile not found');
		}

		const profile = ensure_profile_fields(profile_response.data);
		const insights = generate_insights(
			feed_response.data.feed,
			profile,
			false,
		);

		// Cache and return the data
		const response_data = {
			profile,
			...insights,
			cache_status: {
				profile: 'miss',
				feed: 'miss',
				insights: 'miss',
			},
		};

		profile_cache.set(handle, profile);
		feed_cache.set(handle, feed_response);
		insights_cache.set(handle, insights);

		return Response.json(response_data);
	} catch (err) {
		console.error('Bluesky API error:', err);
		const status =
			err && typeof err === 'object' && 'status' in err
				? (err.status as number)
				: 500;
		const message =
			err instanceof Error ? err.message : 'Failed to fetch data';
		throw error(status, message);
	}
};
