import type { BskyPost, NetworkAnalytics } from '$lib/types';
import { detect_communities } from './communities';
import { build_interaction_network } from './interactions';
import { sum_interactions, sum_post_metric } from './utils';

export function analyse_network(posts: BskyPost[]): NetworkAnalytics {
	try {
		const interaction_data = build_interaction_network(posts);
		const community_info = detect_communities(posts);

		const total_replies = sum_interactions(
			interaction_data.most_replied_to,
		);
		const total_likes = sum_post_metric(posts, 'likeCount');
		const total_reposts = sum_post_metric(posts, 'repostCount');

		return {
			interaction_network: {
				...interaction_data,
				frequent_conversations: [],
			},
			community_detection: {
				primary_communities: community_info.primary_communities.map(
					(c) => c.name,
				),
				interaction_clusters: community_info.primary_communities,
			},
			follower_growth_rate: 0,
			following_growth_rate: 0,
			follower_following_ratio: 0,
			mention_network: {
				incoming: interaction_data.most_mentioned,
				outgoing: [],
			},
			reply_network: {
				incoming: [],
				outgoing: interaction_data.most_replied_to,
			},
			interaction_patterns: {
				likes_given: 0,
				likes_received: total_likes,
				reposts_given: 0,
				reposts_received: total_reposts,
				replies_given: total_replies,
				replies_received: sum_post_metric(posts, 'replyCount'),
			},
			network_centrality: calculate_network_centrality(
				interaction_data,
				community_info,
			),
			influential_followers: [],
		};
	} catch (err) {
		console.error('Error analysing network:', err);
		return get_empty_network_analytics();
	}
}

function calculate_network_centrality(
	interaction_data: ReturnType<typeof build_interaction_network>,
	community_info: ReturnType<typeof detect_communities>,
): number {
	const total_interactions =
		sum_interactions(interaction_data.most_replied_to) +
		sum_interactions(interaction_data.most_quoted) +
		sum_interactions(interaction_data.most_mentioned);

	const community_factor = community_info.primary_communities.reduce(
		(sum, community) => sum + community.interaction_count,
		0,
	);

	return Math.min(
		1,
		total_interactions / 1000 + community_factor / 2000,
	);
}

function get_empty_network_analytics(): NetworkAnalytics {
	return {
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
	};
}

export * from './communities';
export * from './interactions';
export * from './utils';
