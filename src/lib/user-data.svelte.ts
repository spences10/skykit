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
			// Update each property individually to ensure reactivity
			data.profile = new_data.profile;
			data.engagement = new_data.engagement;
			data.content = new_data.content;
			data.temporal = new_data.temporal;
			data.network = new_data.network;
			data.account_classification = new_data.account_classification;
			data.behavioural_insights = new_data.behavioural_insights;
			data.content_strategy_suggestions =
				new_data.content_strategy_suggestions;
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
