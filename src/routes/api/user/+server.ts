import { BSKY_PASSWORD, BSKY_USERNAME } from '$env/static/private';
import { generate_insights } from '$lib/bsky/insights';
import { Cache } from '$lib/cache';
import { rateLimiter } from '$lib/rate-limiter';
import { AtpAgent } from '@atproto/api';
import { error } from '@sveltejs/kit';

const agent = new AtpAgent({ service: 'https://bsky.social' });
const user_cache = new Cache(15);

await rateLimiter.addToQueue(() =>
	agent.login({
		identifier: BSKY_USERNAME,
		password: BSKY_PASSWORD,
	}),
);

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
			rateLimiter.addToQueue(() =>
				agent.api.app.bsky.feed.getAuthorFeed({
					actor: handle,
					limit: 100,
				}),
			),
			rateLimiter.addToQueue(() =>
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
			profile_response.data,
		);
		user_cache.set(handle, insights);
		return Response.json({
			profile: profile_response.data,
			...insights,
		});
	} catch (err) {
		console.error('Bluesky API error:', err);
		throw error(
			err.status || 500,
			err instanceof Error ? err.message : 'Failed to fetch data',
		);
	}
};
