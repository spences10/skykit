import type { BskyPost, ContentPatterns } from '../types';
import { has_links, has_media, is_quote, is_reply } from './helpers';

export function analyse_content(posts: BskyPost[]): ContentPatterns {
	const post_types = calculate_post_types(posts);
	const post_lengths = analyse_post_lengths(posts);
	const hashtag_usage = extract_hashtag_usage(posts);

	return {
		post_types,
		post_lengths,
		hashtag_usage,
	};
}

export function calculate_post_types(posts: BskyPost[]) {
	// First identify reposts
	const reposts = posts.filter(
		(post) =>
			post.reason?.['$type'] === 'app.bsky.feed.defs#reasonRepost',
	);

	// Get posts that aren't reposts
	const non_reposts = posts.filter((post) => !post.reason);

	return {
		original_posts: non_reposts.filter(
			(p) => !is_reply(p) && !is_quote(p),
		).length,
		replies: non_reposts.filter((p) => is_reply(p)).length,
		reposts: reposts.length,
		quotes: non_reposts.filter((p) => is_quote(p)).length,
		with_media: non_reposts.filter((p) => has_media(p)).length,
		with_links: non_reposts.filter((p) => has_links(p)).length,
		text_only: non_reposts.filter(
			(p) => !has_media(p) && !has_links(p),
		).length,
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
