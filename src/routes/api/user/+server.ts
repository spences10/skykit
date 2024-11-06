import { BSKY_PASSWORD, BSKY_USERNAME } from '$env/static/private';
import { AtpAgent } from '@atproto/api';

const agent = new AtpAgent({ service: 'https://bsky.social' });

// Login once when the server starts
await agent.login({
	identifier: BSKY_USERNAME,
	password: BSKY_PASSWORD,
});

export const GET = async ({ url }) => {
	const handle = url.searchParams.get('handle');

	if (!handle) {
		return new Response('Handle is required', { status: 400 });
	}

	try {
		// Get basic profile information
		const response = await agent.getProfile({ actor: handle });
		const profile = response.data;

		return Response.json({
			handle: profile.handle,
			displayName: profile.displayName,
			description: profile.description,
			avatar: profile.avatar,
			followersCount: profile.followersCount,
			followsCount: profile.followsCount,
			postsCount: profile.postsCount,
			indexedAt: profile.indexedAt,
		});
	} catch (err) {
		console.error('Bluesky API error:', err);
		const errorMessage =
			err instanceof Error
				? err.message
				: 'Failed to fetch Bluesky data';
		return new Response(errorMessage, { status: 500 });
	}
};
