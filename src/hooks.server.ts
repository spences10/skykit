import { init_db } from '#lib/db/index.js';
import { themes } from '#lib/themes/index.js';
import { sequence, type Handle } from '@sveltejs/kit/hooks';

export const theme: Handle = async ({ event, resolve }) => {
	const theme = event.cookies.get('theme');

	return await resolve(event, {
		transformPageChunk: ({ html }) => {
			if (theme && themes.includes(theme)) {
				return html.replace('data-theme=""', `data-theme="${theme}"`);
			}
			return html;
		},
	});
};

export const handle = sequence(theme);

// Initialize database
init_db().catch(console.error);
