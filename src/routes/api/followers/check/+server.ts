import { follower_service } from '$lib/db/follower-service';
import { rate_limiter } from '$lib/rate-limiter';
import { AtpAgent } from '@atproto/api';
import { error } from '@sveltejs/kit';

const PUBLIC_API = 'https://public.api.bsky.app';
const agent = new AtpAgent({ service: PUBLIC_API });

export const POST = async ({ request }) => {
	const { did } = await request.json();

	if (!did) {
		throw error(400, 'DID is required');
	}

	try {
		const cursor = await follower_service.get_last_cursor(did);
		const followers = await get_all_followers(did, cursor);
		await follower_service.update_follower_snapshots(did, followers);

		return new Response(
			JSON.stringify({
				success: true,
				followers_checked: followers.length,
			}),
		);
	} catch (err) {
		console.error('Follower check error:', err);
		throw error(500, 'Failed to check followers');
	}
};

async function get_all_followers(did: string, cursor?: string) {
	const followers = new Set<string>();
	let current_cursor = cursor;

	while (true) {
		const response = await rate_limiter.add_to_queue(() =>
			agent.api.app.bsky.graph.getFollowers({
				actor: did,
				cursor: current_cursor,
				limit: 100,
			}),
		);

		response.data.followers.forEach((follower) => {
			followers.add(follower.did);
		});

		if (!response.data.cursor) break;
		current_cursor = response.data.cursor;
	}

	return Array.from(followers);
}
