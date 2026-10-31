import { Cache } from '#lib/cache.js';
import { rate_limiter } from '#lib/rate-limiter.js';
import { query } from '$app/server';
import { AtpAgent } from '@atproto/api';
import * as v from 'valibot';

export interface HandleSuggestion {
	did: string;
	handle: string;
	display_name?: string;
	avatar?: string;
}

const agent = new AtpAgent({
	service: 'https://public.api.bsky.app',
});
// People type the same prefixes; a short cache spares the AppView
const suggestion_cache = new Cache<HandleSuggestion[]>(5);

/** Bluesky accounts whose handle or name starts like the text typed */
export const search_handles = query(
	v.pipe(v.string(), v.trim(), v.minLength(2), v.maxLength(64)),
	async (text): Promise<HandleSuggestion[]> => {
		const key = text.toLowerCase();
		const cached = suggestion_cache.get(key);
		if (cached) return cached;

		const { data } = await rate_limiter.add_to_queue(() =>
			agent.app.bsky.actor.searchActorsTypeahead({
				q: text,
				limit: 6,
			}),
		);
		const suggestions = data.actors.map((actor) => ({
			did: actor.did,
			handle: actor.handle,
			display_name: actor.displayName?.trim() || undefined,
			// The thumbnail size, not the full avatar
			avatar: actor.avatar?.replace(
				'/img/avatar/',
				'/img/avatar_thumbnail/',
			),
		}));
		suggestion_cache.set(key, suggestions);
		return suggestions;
	},
);
