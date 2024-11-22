import type {
	BskyPost,
	BskyProfile,
	EngagementMetrics,
} from '$lib/types';
import { differenceInDays, parseISO } from 'date-fns';

export function analyse_engagement(
	posts: BskyPost[],
	profile: BskyProfile,
): EngagementMetrics {
	const original_posts = posts.filter(
		(post) =>
			!(post.post.record as any).repost &&
			post.post.author.did === profile.did,
	);

	const total_posts = original_posts.length;

	if (!total_posts) {
		return get_empty_engagement_metrics();
	}

	// Add time-based engagement analysis
	const now = new Date();
	const recent_posts = original_posts.filter((post) => {
		const post_date = parseISO(post.post.indexedAt);
		return differenceInDays(now, post_date) <= 30;
	});

	const historical_posts = original_posts.filter((post) => {
		const post_date = parseISO(post.post.indexedAt);
		return differenceInDays(now, post_date) > 30;
	});

	const recent_engagement =
		calculate_engagement_metrics(recent_posts);
	const historical_engagement =
		calculate_engagement_metrics(historical_posts);

	const trending_score = calculate_trending_score(
		recent_engagement,
		historical_engagement,
		profile.followersCount || 1,
	);

	return {
		...calculate_engagement_metrics(original_posts),
		trending_score,
		top_performing_posts: get_top_performing_posts(original_posts),
		engagement_distribution:
			get_engagement_distribution(original_posts),
	};
}

function calculate_engagement_metrics(posts: BskyPost[]) {
	const total_posts = posts.length;
	if (!total_posts) return get_empty_engagement_metrics();

	const total_likes = sum_metric(posts, 'likeCount');
	const total_reposts = sum_metric(posts, 'repostCount');
	const total_replies = sum_metric(posts, 'replyCount');

	const posts_that_are_replies = posts.filter(
		(post) => !!(post.post.record as any).reply,
	).length;

	return {
		total_posts,
		avg_likes_per_post: total_likes / total_posts,
		avg_reposts_per_post: total_reposts / total_posts,
		avg_replies_per_post: total_replies / total_posts,
		reply_rate: Math.min(
			100,
			(posts_that_are_replies / total_posts) * 100,
		),
		repost_rate: Math.min(100, (total_reposts / total_posts) * 100),
		engagement_rate:
			(total_likes + total_reposts + total_replies) / total_posts,
	};
}

function sum_metric(
	posts: BskyPost[],
	metric: 'likeCount' | 'repostCount' | 'replyCount',
): number {
	return posts.reduce(
		(sum, post) => sum + (post.post[metric] ?? 0),
		0,
	);
}

function get_top_performing_posts(posts: BskyPost[]): BskyPost[] {
	return [...posts]
		.sort((a, b) => {
			const eng_a =
				sum_metric([a], 'likeCount') +
				sum_metric([a], 'repostCount') +
				sum_metric([a], 'replyCount');
			const eng_b =
				sum_metric([b], 'likeCount') +
				sum_metric([b], 'repostCount') +
				sum_metric([b], 'replyCount');
			return eng_b - eng_a;
		})
		.slice(0, 5);
}

function get_engagement_distribution(posts: BskyPost[]) {
	return {
		likes: posts.map((p) => p.post.likeCount || 0),
		reposts: posts.map((p) => p.post.repostCount || 0),
		replies: posts.map((p) => p.post.replyCount || 0),
	};
}

function calculate_trending_score(
	recent: ReturnType<typeof calculate_engagement_metrics>,
	historical: ReturnType<typeof calculate_engagement_metrics>,
	follower_count: number,
): number {
	const recent_weight = 0.7;
	const historical_weight = 0.3;

	const recent_score = recent.engagement_rate * recent_weight;
	const historical_score =
		historical.engagement_rate * historical_weight;

	return ((recent_score + historical_score) / follower_count) * 100;
}

function get_empty_engagement_metrics() {
	return {
		total_posts: 0,
		avg_likes_per_post: 0,
		avg_reposts_per_post: 0,
		avg_replies_per_post: 0,
		reply_rate: 0,
		repost_rate: 0,
		engagement_rate: 0,
		top_performing_posts: [],
		engagement_distribution: {
			likes: [],
			reposts: [],
			replies: [],
		},
		trending_score: 0,
	};
}
