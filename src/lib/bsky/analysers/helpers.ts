import type { BskyPost } from '../types';

export const is_reply = (post: BskyPost): boolean =>
	!!(post.post.record as any).reply;

export const is_quote = (post: BskyPost): boolean =>
	!!(post.post.record as any).quote;

export const has_media = (post: BskyPost): boolean =>
	!!post.post.embed?.images?.length;

export const has_links = (post: BskyPost): boolean =>
	!!post.post.embed?.external;

export const extract_mentions = (text: string): string[] =>
	(text.match(/@[\w.-]+/g) || []).map((mention) => mention.slice(1));

export const extract_hashtags = (text: string): string[] =>
	(text.match(/#[\w-]+/g) || []).map((tag) => tag.slice(1));

export const map_to_sorted_array = (
	map: Map<string, number>,
): Array<[string, number]> =>
	Array.from(map.entries())
		.sort(([, a], [, b]) => b - a)
		.slice(0, 10);
