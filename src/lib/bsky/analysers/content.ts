import type { BskyPost, ContentPatterns } from '$lib/types';
import { differenceInDays, parseISO, startOfDay } from 'date-fns';
import { has_links, has_media, is_reply } from './helpers';

export function analyse_content(posts: BskyPost[]): ContentPatterns {
	if (!posts.length) {
		return get_empty_content_patterns();
	}

	const non_reposts = posts.filter((post) => !post.reason);
	const post_types = calculate_post_types(non_reposts, posts);
	const avg_post_length = calculate_avg_post_length(posts);
	const media_engagement = calculate_media_engagement(posts);
	const post_age_distribution =
		calculate_post_age_distribution(posts);

	return {
		post_types,
		avg_post_length,
		most_used_hashtags: extract_hashtags(posts),
		popular_topics: extract_topics(posts),
		language_stats: { en: 100 },
		media_engagement,
		post_age_distribution,
	};
}

function get_empty_content_patterns(): ContentPatterns {
	return {
		post_types: {
			text_only: 0,
			with_media: 0,
			with_links: 0,
			replies: 0,
			reposts: 0,
		},
		avg_post_length: 0,
		most_used_hashtags: [],
		popular_topics: [],
		language_stats: { en: 100 },
		media_engagement: {
			image_posts: { count: 0, avg_engagement: 0 },
			link_posts: { count: 0, avg_engagement: 0 },
		},
		post_age_distribution: new Map(),
	};
}

function calculate_post_types(
	non_reposts: BskyPost[],
	all_posts: BskyPost[],
) {
	return {
		text_only: non_reposts.filter(
			(p) => !has_media(p) && !has_links(p),
		).length,
		with_media: non_reposts.filter((p) => has_media(p)).length,
		with_links: non_reposts.filter((p) => has_links(p)).length,
		replies: non_reposts.filter((p) => is_reply(p)).length,
		reposts: all_posts.filter(
			(p) =>
				p.reason?.['$type'] === 'app.bsky.feed.defs#reasonRepost',
		).length,
	};
}

function calculate_avg_post_length(posts: BskyPost[]): number {
	const lengths = posts.map(
		(p) => (p.post.record as any).text?.length || 0,
	);
	return lengths.reduce((a, b) => a + b, 0) / lengths.length;
}

function extract_hashtags(
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

function extract_topics(posts: BskyPost[]): Array<[string, number]> {
	// Simplified topic extraction based on word frequency
	const topics = new Map<string, number>();

	posts.forEach((post) => {
		const text = (post.post.record as any).text;
		if (!text) return;
		const words = text.toLowerCase().split(/\s+/);
		words.forEach((word: string) => {
			if (word.length > 4) {
				// Simple filter for meaningful words
				topics.set(word, (topics.get(word) || 0) + 1);
			}
		});
	});

	return Array.from(topics.entries())
		.sort(([, a], [, b]) => b - a)
		.slice(0, 10);
}

function calculate_media_engagement(posts: BskyPost[]): {
	image_posts: { count: number; avg_engagement: number };
	link_posts: { count: number; avg_engagement: number };
} {
	const image_posts = posts.filter((p) => has_media(p));
	const link_posts = posts.filter((p) => has_links(p));

	function get_post_engagement(post: BskyPost): number {
		return (
			(post.post.likeCount || 0) +
			(post.post.repostCount || 0) +
			(post.post.replyCount || 0)
		);
	}

	return {
		image_posts: {
			count: image_posts.length,
			avg_engagement: image_posts.length
				? image_posts.reduce(
						(sum, post) => sum + get_post_engagement(post),
						0,
					) / image_posts.length
				: 0,
		},
		link_posts: {
			count: link_posts.length,
			avg_engagement: link_posts.length
				? link_posts.reduce(
						(sum, post) => sum + get_post_engagement(post),
						0,
					) / link_posts.length
				: 0,
		},
	};
}
function calculate_post_age_distribution(
	posts: BskyPost[],
): Map<string, number> {
	const age_distribution = new Map<string, number>();
	const now = new Date();

	posts.forEach((post) => {
		const post_date = parseISO(post.post.indexedAt);
		const age_in_days = differenceInDays(
			startOfDay(now),
			startOfDay(post_date),
		);

		const age_bucket =
			age_in_days <= 7
				? 'week'
				: age_in_days <= 30
					? 'month'
					: age_in_days <= 90
						? 'quarter'
						: 'older';

		age_distribution.set(
			age_bucket,
			(age_distribution.get(age_bucket) || 0) + 1,
		);
	});

	return age_distribution;
}
