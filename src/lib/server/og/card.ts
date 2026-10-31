import { Cache } from '#lib/cache.js';
import { rate_limiter } from '#lib/rate-limiter.js';
import { AtpAgent } from '@atproto/api';
import { Resvg } from '@resvg/resvg-js';
import { get_font_files } from './fonts';
import {
	render_home_card,
	render_profile_card,
	type CardProfile,
} from './render';

const agent = new AtpAgent({
	service: 'https://public.api.bsky.app',
});
const card_cache = new Cache<Buffer>(60);

function to_png(svg: string) {
	return new Resvg(svg, {
		fitTo: { mode: 'original' },
		font: { fontFiles: get_font_files(), loadSystemFonts: false },
	})
		.render()
		.asPng();
}

/** The avatar as a data: URI, or nothing if it can't be fetched */
async function fetch_avatar(url: string | undefined) {
	if (!url) return undefined;
	// The CDN serves WebP by default, which resvg can't decode
	const jpeg_url = /@[a-z]+$/.test(url)
		? url.replace(/@[a-z]+$/, '@jpeg')
		: `${url}@jpeg`;
	try {
		const response = await fetch(jpeg_url, {
			signal: AbortSignal.timeout(5000),
		});
		if (!response.ok) return undefined;
		const type = response.headers.get('content-type') ?? 'image/jpeg';
		const bytes = Buffer.from(await response.arrayBuffer());
		return `data:${type};base64,${bytes.toString('base64')}`;
	} catch {
		return undefined;
	}
}

export function home_card() {
	const cached = card_cache.get('/');
	if (cached) return cached;
	const png = to_png(render_home_card());
	card_cache.set('/', png);
	return png;
}

/** Throws the Bluesky error when the profile can't be read */
export async function profile_card(handle: string) {
	const key = handle.toLowerCase();
	const cached = card_cache.get(key);
	if (cached) return cached;

	const { data } = await rate_limiter.add_to_queue(() =>
		agent.app.bsky.actor.getProfile({ actor: handle }),
	);
	const profile: CardProfile = {
		handle: data.handle,
		display_name: data.displayName?.trim() || data.handle,
		avatar: await fetch_avatar(data.avatar),
		followers: data.followersCount ?? 0,
		following: data.followsCount ?? 0,
		posts: data.postsCount ?? 0,
	};
	const png = to_png(render_profile_card(profile));
	card_cache.set(key, png);
	return png;
}
