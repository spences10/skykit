import { generate_insights } from '$lib/bsky/insights';
import type { BskyProfile } from '$lib/bsky/types';
import { Cache } from '$lib/cache';
import { rate_limiter } from '$lib/rate-limiter';
import type { AppBskyActorDefs } from '@atproto/api';
import { AtpAgent } from '@atproto/api';
import { error } from '@sveltejs/kit';

// Use public API for read operations
const PUBLIC_API = 'https://public.api.bsky.app';
const agent = new AtpAgent({ service: PUBLIC_API });

const user_cache = new Cache(15);

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
		const cached_data = user_cache.get(handle) as {
			profile: BskyProfile;
			[key: string]: any;
		} | null;
		if (cached_data) {
			return Response.json({
				...cached_data,
				rate_limit: rate_limiter.get_status(),
			});
		}

		const [feed_response, profile_response] = await Promise.all([
			rate_limiter.addToQueue(() =>
				agent.api.app.bsky.feed.getAuthorFeed({
					actor: handle,
					limit: 100,
				}),
			),
			rate_limiter.addToQueue(() =>
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

		const data_to_cache = {
			profile,
			...insights,
		};

		user_cache.set(handle, data_to_cache);

		return Response.json({
			...data_to_cache,
			rate_limit: rate_limiter.get_status(),
		});
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
