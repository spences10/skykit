import { themes } from '$lib/themes';
import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';

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
