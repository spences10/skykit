import type { BskyPost, ContentPatterns } from '../types';
import { has_links, has_media, is_quote, is_reply } from './helpers';

export function analyse_content(posts: BskyPost[]): ContentPatterns {
	return {
		post_types: calculate_post_types(posts),
		post_lengths: analyse_post_lengths(posts),
		hashtag_usage: extract_hashtag_usage(posts),
	};
}

export function calculate_post_types(posts: BskyPost[]) {
	const total = posts.length;
	if (!total)
		return {
			original_posts: 0,
			replies: 0,
			reposts: 0,
			quotes: 0,
			with_media: 0,
			with_links: 0,
			text_only: 0,
		};

	return {
		original_posts:
			(posts.filter((p) => !is_reply(p) && !is_quote(p)).length /
				total) *
			100,
		replies: (posts.filter((p) => is_reply(p)).length / total) * 100,
		reposts:
			(posts.filter(
				(p) => p.post.repostCount && p.post.repostCount > 0,
			).length /
				total) *
			100,
		quotes: (posts.filter((p) => is_quote(p)).length / total) * 100,
		with_media:
			(posts.filter((p) => has_media(p)).length / total) * 100,
		with_links:
			(posts.filter((p) => has_links(p)).length / total) * 100,
		text_only:
			(posts.filter((p) => !has_media(p) && !has_links(p)).length /
				total) *
			100,
	};
}

export function analyse_post_lengths(posts: BskyPost[]) {
	const lengths = posts.map(
		(p) => (p.post.record as any).text?.length || 0,
	);
	const average = lengths.reduce((a, b) => a + b, 0) / lengths.length;

	const sorted = [...lengths].sort((a, b) => a - b);
	const median = sorted[Math.floor(sorted.length / 2)];

	const distribution = {
		short: lengths.filter((l) => l < 50).length,
		medium: lengths.filter((l) => l >= 50 && l < 200).length,
		long: lengths.filter((l) => l >= 200).length,
	};

	return { average, median, distribution };
}

export function extract_hashtag_usage(
	posts: BskyPost[],
): Array<[string, number]> {
	const hashtags = new Map<string, number>();

	posts.forEach((post) => {
		const text = (post.post.record as any).text;
		if (!text) return;

		const matches = text.match(/#[\w-]+/g) || [];
		matches.forEach((tag: string) => {
			hashtags.set(tag, (hashtags.get(tag) || 0) + 1);
		});
	});

	return Array.from(hashtags.entries())
		.sort(([, a], [, b]) => b - a)
		.slice(0, 10);
}
