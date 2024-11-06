import { BSKY_PASSWORD, BSKY_USERNAME } from '$env/static/private';
import { AtpAgent } from '@atproto/api';
import type { AppBskyFeedDefs, AppBskyFeedPost } from '@atproto/api';
import { Cache } from '$lib/cache';
import { rateLimiter } from '$lib/rate-limiter'; // Import the rate limiter

const agent = new AtpAgent({ service: 'https://bsky.social' });
const user_cache = new Cache(15); // Cache for 15 minutes

// Login once when the server starts
await rateLimiter.addToQueue(() =>
	agent.login({
		identifier: BSKY_USERNAME,
		password: BSKY_PASSWORD,
	}),
);

export const GET = async ({ url }) => {
	const handle = url.searchParams.get('handle');

	if (!handle) {
		return new Response('Handle is required', { status: 400 });
	}

	try {
		// Check cache first
		const cached_data = user_cache.get(handle);
		if (cached_data) {
			return Response.json(cached_data);
		}

		// Get profile and feed data with rate limiting
		const [feed_response, profile_response] = await Promise.all([
			rateLimiter.addToQueue(() =>
				agent.api.app.bsky.feed.getAuthorFeed({
					actor: handle,
					limit: 100,
				}),
			),
			rateLimiter.addToQueue(() =>
				agent.api.app.bsky.actor.getProfile({
					actor: handle,
				}),
			),
		]);

		const posts = feed_response.data.feed;
		const profile = profile_response.data;

		// Calculate all metrics
		const stats = calculateStats(posts);
		const interactions = analyzeInteractions(posts);

		const combined_data = {
			profile: {
				did: profile.did,
				handle: profile.handle,
				displayName: profile.displayName,
				description: profile.description,
				avatar: profile.avatar,
				followersCount: profile.followersCount,
				followsCount: profile.followsCount,
				postsCount: profile.postsCount,
				indexedAt: profile.indexedAt,
			},
			stats,
			interactions,
		};

		// Cache the results
		user_cache.set(handle, combined_data);

		return Response.json(combined_data);
	} catch (err) {
		console.error('Bluesky API error:', err);
		const error_message =
			err instanceof Error ? err.message : 'Failed to fetch data';
		return new Response(error_message, { status: 500 });
	}
};

function calculateStats(posts: AppBskyFeedDefs.FeedViewPost[]) {
	const stats = {
		total_likes: 0,
		total_reposts: 0,
		total_replies: 0,
		avg_likes_per_post: 0,
		avg_reposts_per_post: 0,
		avg_replies_per_post: 0,
		most_liked_post: null as any,
		most_reposted_post: null as any,
		most_replied_post: null as any,
	};

	posts.forEach((post) => {
		const post_stats = post.post;
		stats.total_likes += post_stats.likeCount || 0;
		stats.total_reposts += post_stats.repostCount || 0;
		stats.total_replies += post_stats.replyCount || 0;

		// Track most engaged posts
		if (
			!stats.most_liked_post ||
			(post_stats.likeCount || 0) > stats.most_liked_post.likeCount
		) {
			stats.most_liked_post = {
				text: post_stats.text,
				likeCount: post_stats.likeCount,
				indexedAt: post_stats.indexedAt,
			};
		}

		if (
			!stats.most_reposted_post ||
			(post_stats.repostCount || 0) >
				stats.most_reposted_post.repostCount
		) {
			stats.most_reposted_post = {
				text: post_stats.text,
				repostCount: post_stats.repostCount,
				indexedAt: post_stats.indexedAt,
			};
		}

		if (
			!stats.most_replied_post ||
			(post_stats.replyCount || 0) >
				stats.most_replied_post.replyCount
		) {
			stats.most_replied_post = {
				text: post_stats.text,
				replyCount: post_stats.replyCount,
				indexedAt: post_stats.indexedAt,
			};
		}
	});

	// Calculate averages
	const post_count = posts.length;
	if (post_count > 0) {
		stats.avg_likes_per_post = stats.total_likes / post_count;
		stats.avg_reposts_per_post = stats.total_reposts / post_count;
		stats.avg_replies_per_post = stats.total_replies / post_count;
	}

	return stats;
}

function analyzeInteractions(posts: AppBskyFeedDefs.FeedViewPost[]) {
	const interaction_data = {
		replies_to: new Map<string, number>(),
		common_words: new Map<string, number>(),
		posting_patterns: {
			time_of_day: new Map<string, number>(),
			days_of_week: new Map<string, number>(),
		},
	};

	for (const post of posts) {
		const post_data = post.post;
		const record = post_data.record as AppBskyFeedPost.Record;

		// Use reply info directly from the post
		if (record?.reply?.parent) {
			const parent_author = record.reply.parent.author?.handle;
			if (parent_author) {
				interaction_data.replies_to.set(
					parent_author,
					(interaction_data.replies_to.get(parent_author) || 0) + 1,
				);
			}
		}

		// Basic text analysis (skip replies and reposts)
		if (record?.text && !record?.reply) {
			const words = record.text
				.toLowerCase()
				.split(/\s+/)
				.filter(
					(word: string) =>
						word.length > 4 &&
						!word.startsWith('@') &&
						!word.startsWith('http'),
				);

			words.forEach((word: string) => {
				interaction_data.common_words.set(
					word,
					(interaction_data.common_words.get(word) || 0) + 1,
				);
			});
		}

		// Posting time patterns
		if (post_data.indexedAt) {
			const post_date = new Date(post_data.indexedAt);
			const hour = post_date.getHours();
			const day = post_date.toLocaleDateString('en-US', {
				weekday: 'long',
			});

			interaction_data.posting_patterns.time_of_day.set(
				`${hour}:00`,
				(interaction_data.posting_patterns.time_of_day.get(
					`${hour}:00`,
				) || 0) + 1,
			);
			interaction_data.posting_patterns.days_of_week.set(
				day,
				(interaction_data.posting_patterns.days_of_week.get(day) ||
					0) + 1,
			);
		}
	}

	// Convert maps to sorted arrays for the response
	return {
		top_replies_to: [...interaction_data.replies_to.entries()]
			.sort((a, b) => b[1] - a[1])
			.slice(0, 10),
		common_topics: [...interaction_data.common_words.entries()]
			.sort((a, b) => b[1] - a[1])
			.slice(0, 20),
		activity_patterns: {
			by_hour: Object.fromEntries(
				interaction_data.posting_patterns.time_of_day,
			),
			by_day: Object.fromEntries(
				interaction_data.posting_patterns.days_of_week,
			),
		},
	};
}
