import { agent, get_profile } from '$lib/server/api';
import { filter_inactive_follows } from '$lib/server/data-processor';
import { error } from '@sveltejs/kit';
import { get_all_follows } from './follows-handler';
import { create_stream_response } from './stream-handler';

export async function GET({ url }) {
	const handle = url.searchParams.get('handle');
	const days = parseInt(url.searchParams.get('days') || '30', 10);
	const stream = url.searchParams.get('stream') === 'true';

	if (!handle) {
		throw error(400, 'Missing handle parameter');
	}

	if (stream) {
		return create_stream_response(handle, days);
	}

	// Non-streaming response
	try {
		const profile = await get_profile(handle);
		const total_follows = profile.data.followsCount || 0;

		const { results: all_follows, cache_stats } =
			await get_all_follows(agent, profile.data.did, total_follows);

		const inactive_follows = filter_inactive_follows(
			all_follows,
			days,
		);

		return Response.json({
			inactive_follows,
			total_follows,
			cache_stats,
		});
	} catch (err) {
		console.error('Error:', err);
		throw error(500, 'Failed to fetch inactive follows');
	}
}
