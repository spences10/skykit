import type {
	ContentPatterns as ContentData,
	EngagementMetrics as EngagementData,
	NetworkAnalytics as NetworkData,
	BskyProfile as Profile,
	TemporalPatterns as TemporalData,
} from './bsky/types';

export type { Profile };

export type UserData = {
	profile: Profile | null;
	rate_limit: any;
	engagement: EngagementData | null;
	content: ContentData | null;
	temporal: TemporalData | null;
	network: NetworkData | null;
	account_classification: string[] | null;
	behavioural_insights: string[] | null;
	content_strategy_suggestions: string[] | null;
};

// Helper function to format numbers with specific precision
const format_number = (
	value: number,
	precision: number = 0,
): number => {
	return Number(value.toFixed(precision));
};

// Helper function to format engagement metrics
const format_engagement_metric = (metric: {
	total: number;
	average: number;
}) => ({
	total: format_number(metric.total),
	average: format_number(metric.average),
});

// Helper function to format engagement data
const format_engagement_data = (
	data: EngagementData,
): EngagementData => ({
	engagement_metrics: {
		likes: format_engagement_metric(data.engagement_metrics.likes),
		reposts: format_engagement_metric(
			data.engagement_metrics.reposts,
		),
		replies: format_engagement_metric(
			data.engagement_metrics.replies,
		),
	},
	avg_engagement_per_post: format_number(
		data.avg_engagement_per_post,
	),
	engagement_rate: format_number(data.engagement_rate),
	conversation_starter_ratio: data.conversation_starter_ratio,
	viral_post_percentage: format_number(data.viral_post_percentage),
	avg_replies_per_post: format_number(data.avg_replies_per_post),
	reply_rate: data.reply_rate,
});

// Helper function to format content data
const format_content_data = (data: ContentData): ContentData => ({
	post_types: {
		original_posts: format_number(data.post_types.original_posts),
		replies: format_number(data.post_types.replies),
		reposts: format_number(data.post_types.reposts),
		quotes: format_number(data.post_types.quotes),
		with_media: format_number(data.post_types.with_media),
		with_links: format_number(data.post_types.with_links),
		text_only: format_number(data.post_types.text_only),
	},
	post_lengths: {
		average: format_number(data.post_lengths.average),
		median: format_number(data.post_lengths.median),
		distribution: Object.fromEntries(
			Object.entries(data.post_lengths.distribution).map(
				([key, value]) => [key, format_number(value)],
			),
		),
	},
	hashtag_usage: data.hashtag_usage.map(([tag, count]) => [
		tag,
		format_number(count),
	]),
});

// Helper function to format temporal data
const format_temporal_data = (data: TemporalData): TemporalData => ({
	posting_frequency: {
		posts_per_day: format_number(
			data.posting_frequency.posts_per_day,
			2, // 2 decimal places for daily posts
		),
		posts_per_week: format_number(
			data.posting_frequency.posts_per_week,
			1, // 1 decimal place for weekly posts
		),
		active_days_percentage: format_number(
			Math.min(data.posting_frequency.active_days_percentage, 100),
			1, // 1 decimal place for percentages
		),
		longest_streak: format_number(
			data.posting_frequency.longest_streak,
		),
		most_active_hours: data.posting_frequency.most_active_hours.map(
			([hour, count]) => [hour, format_number(count)],
		),
		most_active_days: data.posting_frequency.most_active_days.map(
			([day, count]) => [day, format_number(count)],
		),
		date_range: {
			from: data.posting_frequency.date_range.from,
			to: data.posting_frequency.date_range.to,
			total_days: format_number(
				data.posting_frequency.date_range.total_days,
			),
		},
	},
	consistency_score: format_number(data.consistency_score, 2),
	peak_activity_windows: data.peak_activity_windows,
});

// Helper function to format network data
const format_network_data = (data: NetworkData): NetworkData => ({
	interaction_network: {
		most_replied_to: data.interaction_network.most_replied_to.map(
			([user, count]) => [user, format_number(count)],
		),
		most_quoted: data.interaction_network.most_quoted.map(
			([user, count]) => [user, format_number(count)],
		),
		most_mentioned: data.interaction_network.most_mentioned.map(
			([user, count]) => [user, format_number(count)],
		),
		frequent_conversations:
			data.interaction_network.frequent_conversations.map(
				(conversation) => ({
					participant: conversation.participant,
					interaction_count: format_number(
						conversation.interaction_count,
					),
					last_interaction: conversation.last_interaction,
				}),
			),
	},
	community_detection: {
		primary_communities: data.community_detection.primary_communities,
		interaction_clusters:
			data.community_detection.interaction_clusters.map(
				(cluster) => ({
					name: cluster.name,
					users: cluster.users,
					interaction_count: format_number(cluster.interaction_count),
				}),
			),
	},
});

export function create_user_data() {
	let data = $state<UserData>({
		profile: null,
		rate_limit: null,
		engagement: null,
		content: null,
		temporal: null,
		network: null,
		account_classification: null,
		behavioural_insights: null,
		content_strategy_suggestions: null,
	});

	function update_data(new_data: Partial<UserData>) {
		const formatted_data = { ...new_data };

		if (formatted_data.engagement) {
			formatted_data.engagement = format_engagement_data(
				formatted_data.engagement,
			);
		}
		if (formatted_data.content) {
			formatted_data.content = format_content_data(
				formatted_data.content,
			);
		}
		if (formatted_data.temporal) {
			formatted_data.temporal = format_temporal_data(
				formatted_data.temporal,
			);
		}
		if (formatted_data.network) {
			formatted_data.network = format_network_data(
				formatted_data.network,
			);
		}

		for (const [key, value] of Object.entries(formatted_data)) {
			data[key as keyof UserData] = value;
		}
	}

	return {
		get data() {
			return data;
		},
		update_data,
	};
}

export const user_store = create_user_data();
