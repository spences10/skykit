import { home_card } from '#lib/server/og/card.js';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = () =>
	new Response(new Uint8Array(home_card()), {
		headers: {
			'content-type': 'image/png',
			'cache-control': 'public, max-age=86400',
		},
	});
