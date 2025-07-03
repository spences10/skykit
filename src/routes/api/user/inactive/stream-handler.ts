import { MAX_INACTIVE_FOLLOWS_LIMIT } from '$lib/constants';
import { agent, get_profile } from '$lib/server/api';
import { filter_inactive_follows } from '$lib/server/data-processor';
import type { ReadableStreamDefaultController } from 'node:stream/web';
import { get_all_follows } from './follows-handler';

export function create_stream_response(handle: string, days: number) {
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
			const total_follows = profile.data.followsCount || 0;

			// Check follow count limit
			if (total_follows > MAX_INACTIVE_FOLLOWS_LIMIT) {
				const encoder = new TextEncoder();
				controller.enqueue(
					encoder.encode(
						`data: ${JSON.stringify({
							type: 'error',
							error: `This account follows ${total_follows.toLocaleString()} people, which exceeds our limit of ${MAX_INACTIVE_FOLLOWS_LIMIT.toLocaleString()}. This is a free service - please don't abuse it! 🚀💥`,
							followsCount: total_follows,
							limit: MAX_INACTIVE_FOLLOWS_LIMIT,
						})}\n\n`,
					),
				);
				controller.close();
				return;
			}

			const { results: all_follows, cache_stats } =
				await get_all_follows(
					agent,
					profile.data.did,
					total_follows,
					controller,
				);

			const inactive_follows = filter_inactive_follows(
				all_follows,
				days,
			);

			const encoder = new TextEncoder();
			controller.enqueue(
				encoder.encode(
					`data: ${JSON.stringify({
						type: 'complete',
						inactive_follows,
						cache_stats,
					})}\n\n`,
				),
			);
			controller.close();
		} catch (err) {
			console.error('Stream error:', err);
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
