import type { AnalysisResults, BskyProfile } from '$lib/types';

export type { BskyProfile };

// Extend AnalysisResults to include profile
export type UserData = AnalysisResults & {
	profile: BskyProfile | null;
};

function create_user_data() {
	let data = $state<UserData>({
		profile: null,
		engagement: {
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
		},
		content: {
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
			language_stats: {},
			media_engagement: {
				image_posts: {
					count: 0,
					avg_engagement: 0,
				},
				link_posts: {
					count: 0,
					avg_engagement: 0,
				},
			},
		},
		temporal: {
			posting_frequency: {
				posts_per_day: 0,
				posts_per_week: 0,
				date_range: {
					from: '',
					to: '',
					total_days: 0,
				},
				active_days_percentage: 0,
				longest_streak: 0,
				most_active_hours: [],
				most_active_days: [],
			},
			peak_activity_windows: [],
			timezone: '',
		},
		network: {
			interaction_network: {
				most_replied_to: [],
				most_quoted: [],
				most_mentioned: [],
				frequent_conversations: [],
			},
			community_detection: {
				primary_communities: [],
				interaction_clusters: [],
			},
			follower_growth_rate: 0,
			following_growth_rate: 0,
			follower_following_ratio: 0,
			mention_network: {
				incoming: [],
				outgoing: [],
			},
			reply_network: {
				incoming: [],
				outgoing: [],
			},
			interaction_patterns: {
				likes_given: 0,
				likes_received: 0,
				reposts_given: 0,
				reposts_received: 0,
				replies_given: 0,
				replies_received: 0,
			},
			network_centrality: 0,
			influential_followers: [],
		},
		account_classification: [],
		behavioural_insights: [],
		content_strategy_suggestions: [],
	});

	const update_data = (new_data: UserData) => {
		// Only update if data has actually changed
		if (JSON.stringify(data) !== JSON.stringify(new_data)) {
			// Update profile
			data.profile = new_data.profile;

			// Update engagement metrics individually
			data.engagement.total_posts = new_data.engagement.total_posts;
			data.engagement.avg_likes_per_post =
				new_data.engagement.avg_likes_per_post;
			data.engagement.avg_reposts_per_post =
				new_data.engagement.avg_reposts_per_post;
			data.engagement.avg_replies_per_post =
				new_data.engagement.avg_replies_per_post;
			data.engagement.reply_rate = new_data.engagement.reply_rate;
			data.engagement.repost_rate = new_data.engagement.repost_rate;
			data.engagement.engagement_rate =
				new_data.engagement.engagement_rate;
			data.engagement.top_performing_posts = [
				...new_data.engagement.top_performing_posts,
			];
			data.engagement.engagement_distribution = {
				likes: [...new_data.engagement.engagement_distribution.likes],
				reposts: [
					...new_data.engagement.engagement_distribution.reposts,
				],
				replies: [
					...new_data.engagement.engagement_distribution.replies,
				],
			};
			data.engagement.trending_score =
				new_data.engagement.trending_score;

			// Update content metrics
			data.content.post_types = { ...new_data.content.post_types };
			data.content.avg_post_length = new_data.content.avg_post_length;
			data.content.most_used_hashtags = [
				...new_data.content.most_used_hashtags,
			];
			data.content.popular_topics = [
				...new_data.content.popular_topics,
			];
			data.content.language_stats = {
				...new_data.content.language_stats,
			};
			data.content.media_engagement = {
				image_posts: {
					...new_data.content.media_engagement.image_posts,
				},
				link_posts: {
					...new_data.content.media_engagement.link_posts,
				},
			};

			// Update temporal metrics
			data.temporal.posting_frequency = {
				...new_data.temporal.posting_frequency,
				date_range: {
					...new_data.temporal.posting_frequency.date_range,
				},
				most_active_hours: [
					...new_data.temporal.posting_frequency.most_active_hours,
				],
				most_active_days: [
					...new_data.temporal.posting_frequency.most_active_days,
				],
			};
			data.temporal.peak_activity_windows = [
				...new_data.temporal.peak_activity_windows,
			];
			data.temporal.timezone = new_data.temporal.timezone;

			// Update network metrics
			data.network = {
				...new_data.network,
				interaction_network: {
					most_replied_to: [
						...new_data.network.interaction_network.most_replied_to,
					],
					most_quoted: [
						...new_data.network.interaction_network.most_quoted,
					],
					most_mentioned: [
						...new_data.network.interaction_network.most_mentioned,
					],
					frequent_conversations: [
						...new_data.network.interaction_network
							.frequent_conversations,
					],
				},
				community_detection: {
					primary_communities: [
						...new_data.network.community_detection
							.primary_communities,
					],
					interaction_clusters: [
						...new_data.network.community_detection
							.interaction_clusters,
					],
				},
				mention_network: {
					incoming: [...new_data.network.mention_network.incoming],
					outgoing: [...new_data.network.mention_network.outgoing],
				},
				reply_network: {
					incoming: [...new_data.network.reply_network.incoming],
					outgoing: [...new_data.network.reply_network.outgoing],
				},
				interaction_patterns: {
					...new_data.network.interaction_patterns,
				},
				influential_followers: [
					...new_data.network.influential_followers,
				],
			};

			// Update arrays
			data.account_classification = [
				...new_data.account_classification,
			];
			data.behavioural_insights = [...new_data.behavioural_insights];
			data.content_strategy_suggestions = [
				...new_data.content_strategy_suggestions,
			];
		}
	};

	return {
		get data() {
			return data;
		},
		update_data,
	};
}

export const user_store = create_user_data();
