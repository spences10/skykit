import type {
	BskyPost,
	BskyProfile,
	EngagementMetrics,
} from '../types';

export function analyse_engagement(
	posts: BskyPost[],
	profile: BskyProfile,
): EngagementMetrics {
	const total_posts = posts.length;
	if (!total_posts) {
		return {
			engagement_metrics: {
				likes: { total: 0, average: 0 },
				reposts: { total: 0, average: 0 },
				replies: { total: 0, average: 0 },
			},
			avg_engagement_per_post: 0,
			engagement_rate: 0,
			conversation_starter_ratio: 0,
			viral_post_percentage: 0,
			avg_replies_per_post: 0,
			reply_rate: 0,
		};
	}

	// Calculate total engagements
	const total_likes = posts.reduce(
		(sum, post) => sum + (post.post.likeCount || 0),
		0,
	);
	const total_reposts = posts.reduce(
		(sum, post) => sum + (post.post.repostCount || 0),
		0,
	);
	const total_replies = posts.reduce(
		(sum, post) => sum + (post.post.replyCount || 0),
		0,
	);

	const avg_engagement_per_post = 
		(total_likes + total_reposts + total_replies) / total_posts;

	// Calculate engagement rate as a percentage
	const engagement_rate = profile.followersCount
		? (avg_engagement_per_post / profile.followersCount) * 100
		: 0;

	return {
		engagement_metrics: {
			likes: {
				total: total_likes,
				average: total_likes / total_posts,
			},
			reposts: {
				total: total_reposts,
				average: total_reposts / total_posts,
			},
			replies: {
				total: total_replies,
				average: total_replies / total_posts,
			},
		},
		avg_engagement_per_post,
		engagement_rate,
		conversation_starter_ratio: get_conversation_starter_ratio(posts),
		viral_post_percentage: calculate_viral_post_percentage(posts),
		avg_replies_per_post: get_average_replies_per_post(posts),
		reply_rate: get_reply_rate(posts),
	};
}

export function calculate_total_engagement(
	posts: BskyPost[],
): number {
	return posts.reduce((total, post) => {
		const p = post.post;
		return (
			total +
			(p.likeCount || 0) +
			(p.repostCount || 0) +
			(p.replyCount || 0)
		);
	}, 0);
}

export function calculate_engagement_rate(
	totalEngagement: number,
	followerCount: number,
): number {
	if (!followerCount) return 0;
	return (totalEngagement / followerCount) * 100;
}

export function get_conversation_starter_ratio(
	posts: BskyPost[],
): number {
	const threadStarters = posts.filter((post) => {
		const record = post.post.record as any;
		return (
			!record.reply &&
			post.post.replyCount &&
			post.post.replyCount > 0
		);
	});
	return posts.length ? threadStarters.length / posts.length : 0;
}

export function calculate_viral_post_percentage(
	posts: BskyPost[],
): number {
	if (!posts.length) return 0;

	const avg_engagement =
		calculate_total_engagement(posts) / posts.length;
	const viral_posts = posts.filter((post) => {
		const engagement =
			(post.post.likeCount || 0) +
			(post.post.repostCount || 0) +
			(post.post.replyCount || 0);
		return engagement > avg_engagement * 2;
	});

	// Convert to percentage
	return (viral_posts.length / posts.length) * 100;
}

export function get_average_replies_per_post(
	posts: BskyPost[],
): number {
	if (!posts.length) return 0;
	const totalReplies = posts.reduce(
		(sum, post) => sum + (post.post.replyCount || 0),
		0,
	);
	return totalReplies / posts.length;
}

export function get_reply_rate(posts: BskyPost[]): number {
	const replies = posts.filter(
		(post) => (post.post.record as any).reply,
	);
	return posts.length ? replies.length / posts.length : 0;
}
