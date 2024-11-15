import type {
	BskyPost,
	BskyProfile,
	EngagementMetrics,
} from '$lib/types';

export function analyse_engagement(
	posts: BskyPost[],
	profile: BskyProfile,
): EngagementMetrics {
	// Filter out reposts and get only original posts
	const original_posts = posts.filter((post) => {
		const record = post.post.record as any;
		return !record.repost && post.post.author.did === profile.did;
	});

	const total_posts = original_posts.length;

	if (!total_posts) {
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

	// Calculate engagement totals
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
	const avg_likes_per_post = total_likes / total_posts;
	const avg_reposts_per_post = total_reposts / total_posts;
	const avg_replies_per_post = total_replies / total_posts;

	// Calculate rates
	const posts_that_are_replies = original_posts.filter((post) => {
		const record = post.post.record as any;
		return !!record.reply;
	}).length;

	const reply_rate = (posts_that_are_replies / total_posts) * 100;
	const repost_rate = (total_reposts / total_posts) * 100;

	// Calculate overall engagement rate
	const total_engagement =
		total_likes + total_reposts + total_replies;
	const engagement_rate =
		(total_engagement / (profile.followersCount || 1)) * 100;

	// Get top performing posts by total engagement
	const sorted_posts = [...original_posts].sort((a, b) => {
		const eng_a =
			(a.post.likeCount || 0) +
			(a.post.repostCount || 0) +
			(a.post.replyCount || 0);
		const eng_b =
			(b.post.likeCount || 0) +
			(b.post.repostCount || 0) +
			(b.post.replyCount || 0);
		return eng_b - eng_a;
	});

	// Create engagement distribution arrays
	const engagement_distribution = {
		likes: original_posts.map((p) => p.post.likeCount || 0),
		reposts: original_posts.map((p) => p.post.repostCount || 0),
		replies: original_posts.map((p) => p.post.replyCount || 0),
	};

	// Calculate trending score (simplified version)
	const avg_engagement_per_post = total_engagement / total_posts;
	const trending_score =
		(avg_engagement_per_post / (profile.followersCount || 1)) * 100;

	return {
		total_posts,
		avg_likes_per_post,
		avg_reposts_per_post,
		avg_replies_per_post,
		reply_rate,
		repost_rate,
		engagement_rate,
		top_performing_posts: sorted_posts.slice(0, 5),
		engagement_distribution,
		trending_score,
	};
}
