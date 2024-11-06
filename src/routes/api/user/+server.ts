import { BSKY_PASSWORD, BSKY_USERNAME } from '$env/static/private';
import { generate_insights } from '$lib/bsky/insights';
import type { BskyProfile } from '$lib/bsky/types';
import { Cache } from '$lib/cache';
import { rate_limiter } from '$lib/rate-limiter';
import type { AppBskyActorDefs } from '@atproto/api';
import { AtpAgent } from '@atproto/api';
import { error } from '@sveltejs/kit';

const agent = new AtpAgent({ service: 'https://bsky.social' });
const user_cache = new Cache(15);

await rate_limiter.addToQueue(() =>
	agent.login({
		identifier: BSKY_USERNAME,
		password: BSKY_PASSWORD,
	}),
);

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
		const cached_data = user_cache.get(handle);
		if (cached_data) {
			return Response.json(cached_data);
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

		const insights = generate_insights(
			feed_response.data.feed,
			ensure_profile_fields(profile_response.data),
		);
		user_cache.set(handle, insights);
		return Response.json({
			profile: profile_response.data,
			...insights,
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
