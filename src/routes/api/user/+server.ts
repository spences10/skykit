import { generate_insights } from '$lib/bsky/insights';
import { Cache } from '$lib/cache';
import { rate_limiter } from '$lib/rate-limiter';
import type { BskyProfile } from '$lib/types';
import type { AppBskyActorDefs } from '@atproto/api';
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
		followersCount: profile.followersCount || 0,
		followsCount: profile.followsCount || 0,
		postsCount: profile.postsCount || 0,
		indexedAt: profile.indexedAt || new Date().toISOString(),
	};
}

export const GET = async ({ url }) => {
	const handle = url.searchParams.get('handle');

	if (!handle) {
		throw error(400, 'Handle is required');
	}

	try {
		// Try to get cached data first
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

		// Fetch what we need
		const [feed_response, profile_response] = await Promise.all([
			rate_limiter.add_to_queue(() =>
				agent.api.app.bsky.feed.getAuthorFeed({
					actor: handle,
					limit: 100, // Always fetch 100 posts
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
