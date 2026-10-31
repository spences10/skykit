import { max_inactive_follows_limit } from '#lib/constants.js';
import { agent, get_profile } from '#lib/server/api.js';
import { filter_inactive_follows } from '#lib/server/data-processor.js';
import type { InactiveFollow } from '#lib/types.js';
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

	void (async () => {
		try {
			const controller = await promise;
			const profile = await get_profile(handle);
			const total_follows = profile.data.followsCount || 0;

			// Check follow count limit
			if (total_follows > max_inactive_follows_limit) {
				const encoder = new TextEncoder();
				controller.enqueue(
					encoder.encode(
						`data: ${JSON.stringify({
							type: 'error',
							error: `This account follows ${total_follows.toLocaleString()} people, which exceeds our limit of ${max_inactive_follows_limit.toLocaleString()}. This is a free service - please don't abuse it! 🚀💥`,
							followsCount: total_follows,
							limit: max_inactive_follows_limit,
						})}\n\n`,
					),
				);
				controller.close();
				return;
			}

			// Send each batch of inactive accounts as soon as it is ready
			const encoder = new TextEncoder();
			const send_results = (batch: InactiveFollow[]) => {
				const inactive = filter_inactive_follows(batch, days);
				if (inactive.length === 0) return;
				controller.enqueue(
					encoder.encode(
						`data: ${JSON.stringify({
							type: 'results',
							inactive_follows: inactive,
						})}\n\n`,
					),
				);
			};

			const { results: all_follows, cache_stats } =
				await get_all_follows(
					agent,
					profile.data.did,
					total_follows,
					controller,
					send_results,
				);

			const inactive_follows = filter_inactive_follows(
				all_follows,
				days,
			);

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
