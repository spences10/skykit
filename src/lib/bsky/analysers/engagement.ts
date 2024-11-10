import type {
	BskyPost,
	BskyProfile,
	EngagementMetrics,
} from '../types';

export function analyse_engagement(
	posts: BskyPost[],
	profile: BskyProfile,
): EngagementMetrics {
	// Filter out reposts and get only original posts
	const original_posts = posts.filter((post) => {
		const record = post.post.record as any;
		// Check if it's not a repost and the post is authored by the profile
		return !record.repost && post.post.author.did === profile.did;
	});

	const total_posts = original_posts.length;

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

	// Calculate engagement totals for original posts
	const total_likes = original_posts.reduce(
		(sum, post) => sum + (post.post.likeCount || 0),
		0,
	);
	const total_reposts = original_posts.reduce(
		(sum, post) => sum + (post.post.repostCount || 0),
		0,
	);
	const total_replies = original_posts.reduce(
		(sum, post) => sum + (post.post.replyCount || 0),
		0,
	);

	// Calculate averages
	const avg_likes = total_likes / total_posts;
	const avg_reposts = total_reposts / total_posts;
	const avg_replies = total_replies / total_posts;
	const avg_engagement_per_post =
		(total_likes + total_reposts + total_replies) / total_posts;

	// A post is considered viral if it has:
	// - At least 5 total engagements (likes + reposts + replies) AND
	// - Engagement is at least 3x the user's average engagement AND
	// - Has more engagements than the user has followers/10 (to account for follower count)
	const viral_posts = original_posts.filter((post) => {
		const post_engagement =
			(post.post.likeCount || 0) +
			(post.post.repostCount || 0) +
			(post.post.replyCount || 0);
		const follower_threshold = Math.max(
			5,
			Math.floor((profile.followersCount || 0) / 10),
		);

		return (
			post_engagement >= 5 &&
			post_engagement >= avg_engagement_per_post * 3 &&
			post_engagement >= follower_threshold
		);
	});

	const viral_post_percentage =
		(viral_posts.length / total_posts) * 100;

	// Fixed conversation metrics
	// Count posts that are replies to others
	const posts_that_are_replies = original_posts.filter((post) => {
		const record = post.post.record as any;
		return !!record.reply;
	}).length;

	// Count posts that received replies
	const posts_with_replies = original_posts.filter(
		(post) => (post.post.replyCount || 0) > 0,
	).length;

	// Calculate percentages correctly
	const reply_rate = (posts_that_are_replies / total_posts) * 100;
	const conversation_starter_ratio =
		(posts_with_replies / total_posts) * 100;

	return {
		engagement_metrics: {
			likes: { total: total_likes, average: avg_likes },
			reposts: { total: total_reposts, average: avg_reposts },
			replies: { total: total_replies, average: avg_replies },
		},
		avg_engagement_per_post,
		engagement_rate:
			(avg_engagement_per_post / (profile.followersCount || 1)) * 100,
		conversation_starter_ratio,
		viral_post_percentage,
		avg_replies_per_post: avg_replies,
		reply_rate,
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
