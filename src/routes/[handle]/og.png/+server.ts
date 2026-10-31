import { to_http_status } from '#lib/server/http-status.js';
import { profile_card } from '#lib/server/og/card.js';
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const png = await profile_card(params.handle);
		return new Response(new Uint8Array(png), {
			headers: {
				'content-type': 'image/png',
				'cache-control': 'public, max-age=3600',
			},
		});
	} catch (err) {
		const message =
			err instanceof Error ? err.message : 'Failed to make card';
		throw error(to_http_status(err, message), message);
	}
};
