import type { AppBskyActorDefs, AppBskyFeedDefs } from '@atproto/api';

export type BskyProfile = AppBskyActorDefs.ProfileViewDetailed;

export type BskyPost = AppBskyFeedDefs.FeedViewPost;

export interface EngagementMetrics {
	total_posts: number;
	avg_likes_per_post: number;
	avg_reposts_per_post: number;
	avg_replies_per_post: number;
	reply_rate: number;
	repost_rate: number;
	engagement_rate: number;
	top_performing_posts: BskyPost[];
	engagement_distribution: {
		likes: number[];
		reposts: number[];
		replies: number[];
	};
	trending_score: number;
}

export interface ContentPatterns {
	post_types: {
		text_only: number;
		with_media: number;
		with_links: number;
		replies: number;
		reposts: number;
	};
	avg_post_length: number;
	most_used_hashtags: Array<[string, number]>;
	popular_topics: Array<[string, number]>;
	language_stats: {
		[key: string]: number;
	};
	media_engagement: {
		image_posts: {
			count: number;
			avg_engagement: number;
		};
		link_posts: {
			count: number;
			avg_engagement: number;
		};
	};
	post_age_distribution?: Map<string, number>;
}

export interface TemporalPatterns {
	posting_frequency: {
		posts_per_day: number;
		posts_per_week: number;
		date_range: {
			from: string;
			to: string;
			total_days: number;
		};
		active_days_percentage: number;
		longest_streak: number;
		most_active_hours: Array<[string, number]>;
		most_active_days: Array<[string, number]>;
	};
	peak_activity_windows: string[];
}

export interface NetworkAnalytics {
	interaction_network: {
		most_replied_to: Array<[string, number]>;
		most_quoted: Array<[string, number]>;
		most_mentioned: Array<[string, number]>;
		frequent_conversations: Array<[string, number]>;
	};
	community_detection: {
		primary_communities: string[];
		interaction_clusters: Array<{
			name: string;
			users: string[];
			interaction_count: number;
		}>;
	};
	follower_growth_rate: number;
	following_growth_rate: number;
	follower_following_ratio: number;
	mention_network: {
		incoming: Array<[string, number]>;
		outgoing: Array<[string, number]>;
	};
	reply_network: {
		incoming: Array<[string, number]>;
		outgoing: Array<[string, number]>;
	};
	interaction_patterns: {
		likes_given: number;
		likes_received: number;
		reposts_given: number;
		reposts_received: number;
		replies_given: number;
		replies_received: number;
	};
	network_centrality: number;
	influential_followers: Array<{
		did: string;
		handle: string;
		displayName?: string;
		avatar?: string;
		followers: number;
	}>;
}

export interface AnalysisResults {
	engagement: EngagementMetrics;
	content: ContentPatterns;
	temporal: TemporalPatterns;
	network: NetworkAnalytics;
	account_classification: string[];
	behavioural_insights: string[];
	content_strategy_suggestions: string[];
}

export interface RateLimitStatus {
	remaining_requests: number;
	queue_length: number;
	is_limited: boolean;
	is_healthy: boolean;
	reset_time?: Date;
	max_requests: number;
}

export interface FeedResults {
	success: boolean;
	data: BskyPost[];
}

export interface CacheStats {
	total_processed: number;
	cache_hits: number;
	cache_misses: number;
	hit_rate: number;
}

export interface InactiveFollow {
	did: string;
	handle: string;
	displayName?: string;
	lastPost: string;
	lastPostDate: Date;
	createdAt: string;
	source?: 'cache' | 'api';
	follows_back: boolean;
}

export interface UserData {
	inactive_follows?: InactiveFollow[];
	cache_stats?: CacheStats;
}

export type ProcessingStage =
	| 'cache'
	| 'follows'
	| 'profiles'
	| 'feeds'
	| 'complete';

export interface ProcessingStats {
	stage: ProcessingStage;
	processed: number;
	total: number;
	current: string;
	cache_hits: number;
	cache_misses: number;
	average_time_per_item?: number;
	start_time: Date;
	cached?: boolean;
	batch_progress?: {
		current: number;
		total: number;
	};
	data_source?: 'cache' | 'api';
	current_batch_source?: string;
}

export interface CachedAccount {
	did: string;
	handle: string;
	last_post_date: Date | null;
	last_checked: Date;
	post_count: number | null;
	followers_count: number | null;
	follows_back: boolean;
}

// Use libsql types directly instead of custom interfaces
export type {
	Client as DbClient,
	Transaction as DbTransaction,
} from '@libsql/client';
