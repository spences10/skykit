import type { AppBskyFeedDefs } from '@atproto/api';

export type BskyPost = AppBskyFeedDefs.FeedViewPost;
export type BskyProfile = {
	did: string;
	handle: string;
	displayName?: string;
	description?: string;
	avatar?: string;
	followersCount: number;
	followsCount: number;
	postsCount: number;
	indexedAt: string;
};

export type EngagementMetrics = {
	engagement_metrics: {
		likes: {
			total: number;
			average: number;
		};
		reposts: {
			total: number;
			average: number;
		};
		replies: {
			total: number;
			average: number;
		};
	};
	avg_engagement_per_post: number;
	engagement_rate: number;
	conversation_starter_ratio: number;
	viral_post_percentage: number;
	avg_replies_per_post: number;
	reply_rate: number;
};

export type ContentPatterns = {
	post_types: {
		original_posts: number;
		replies: number;
		reposts: number;
		quotes: number;
		with_media: number;
		with_links: number;
		text_only: number;
	};
	post_lengths: {
		average: number;
		median: number;
		distribution: Record<string, number>; // e.g., "short", "medium", "long"
	};
	hashtag_usage: Array<[string, number]>;
};

export type TemporalPatterns = {
	posting_frequency: {
		posts_per_day: number;
		posts_per_week: number;
		active_days_percentage: number;
		longest_streak: number;
		most_active_hours: Array<[string, number]>;
		most_active_days: Array<[string, number]>;
		date_range: {
			from: string | null;
			to: string | null;
			total_days: number;
		};
	};
	consistency_score: number;
	peak_activity_windows: string[];
};

export type NetworkAnalytics = {
	interaction_network: {
		most_replied_to: Array<[string, number]>;
		most_quoted: Array<[string, number]>;
		most_mentioned: Array<[string, number]>;
		frequent_conversations: Array<{
			participant: string;
			interaction_count: number;
			last_interaction: string;
		}>;
	};
	community_detection: {
		primary_communities: string[];
		interaction_clusters: Array<{
			name: string;
			users: string[];
			interaction_count: number;
		}>;
	};
};

export type ContentAnalytics = {
	topics: Array<{
		name: string;
		frequency: number;
		avg_engagement: number;
		related_terms: string[];
	}>;
	sentiment_patterns: {
		overall_sentiment: number;
		sentiment_distribution: Record<string, number>;
		most_positive_topics: string[];
		most_negative_topics: string[];
	};
	conversation_patterns: {
		thread_participation: number;
		thread_initiation: number;
		avg_thread_length: number;
		thread_completion_rate: number;
	};
};
