import type { BskyPost, NetworkAnalytics } from '$lib/types';
import type { AppBskyActorDefs } from '@atproto/api';

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
		console.error('Error analyzing network:', err);
		return get_empty_network_analytics();
	}
}

function sum_interactions(
	interactions: Array<[string, number]>,
): number {
	return interactions.reduce((sum, [, count]) => sum + count, 0);
}

function sum_post_metric(
	posts: BskyPost[],
	metric: 'likeCount' | 'repostCount' | 'replyCount',
): number {
	return posts.reduce(
		(sum, post) => sum + (post.post[metric] ?? 0),
		0,
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

function build_interaction_network(posts: BskyPost[]) {
	const interactions = {
		most_replied_to: new Map<string, number>(),
		most_quoted: new Map<string, number>(),
		most_mentioned: new Map<string, number>(),
	};

	posts.forEach((post) => {
		const reply_author = (
			post.reply?.parent?.author as AppBskyActorDefs.ProfileViewBasic
		)?.handle;
		if (reply_author && reply_author !== post.post.author.handle) {
			interactions.most_replied_to.set(
				reply_author,
				(interactions.most_replied_to.get(reply_author) || 0) + 1,
			);
		}

		const quote_author = (post.post.record as any).quote?.author;
		if (quote_author) {
			interactions.most_quoted.set(
				quote_author,
				(interactions.most_quoted.get(quote_author) || 0) + 1,
			);
		}

		const text = (post.post.record as any).text || '';
		const mentions = text.match(/(@\w+\.[\w.]+)/g) || [];
		mentions.forEach((mention: string) => {
			const handle = mention.slice(1);
			interactions.most_mentioned.set(
				handle,
				(interactions.most_mentioned.get(handle) || 0) + 1,
			);
		});
	});

	return {
		most_replied_to: map_to_sorted_array(
			interactions.most_replied_to,
		),
		most_quoted: map_to_sorted_array(interactions.most_quoted),
		most_mentioned: map_to_sorted_array(interactions.most_mentioned),
	};
}

function map_to_sorted_array(
	map: Map<string, number>,
): Array<[string, number]> {
	return Array.from(map.entries())
		.sort(([, a], [, b]) => b - a)
		.slice(0, 10);
}

function add_interaction(
	interactions: Map<string, Set<string>>,
	user1: string,
	user2: string,
) {
	if (!interactions.has(user1)) {
		interactions.set(user1, new Set());
	}
	if (!interactions.has(user2)) {
		interactions.set(user2, new Set());
	}
	interactions.get(user1)?.add(user2);
	interactions.get(user2)?.add(user1);
}

function detect_communities(posts: BskyPost[]) {
	const interactions = new Map<string, Set<string>>();

	posts.forEach((post) => {
		const current_author = post.post.author.handle;
		const reply_author = (
			post.reply?.parent?.author as AppBskyActorDefs.ProfileViewBasic
		)?.handle;

		if (reply_author) {
			add_interaction(interactions, current_author, reply_author);
		}

		const text = (post.post.record as any).text || '';
		const mentions = text.match(/(@\w+\.[\w.]+)/g) || [];
		mentions.forEach((mention: string) => {
			const handle = mention.slice(1);
			add_interaction(interactions, current_author, handle);
		});
	});

	const communities = find_communities(interactions);

	return {
		primary_communities: communities
			.map((community) => ({
				members: Array.from(community),
				size: community.size,
				interaction_count: calculate_community_interactions(
					community,
					interactions,
				),
			}))
			.sort((a, b) => b.interaction_count - a.interaction_count)
			.slice(0, 5)
			.map((c) => ({
				name: `Community of ${c.members[0]}`,
				users: c.members,
				interaction_count: c.interaction_count,
			})),
	};
}

function calculate_network_centrality(
	interaction_data: ReturnType<typeof build_interaction_network>,
	community_info: ReturnType<typeof detect_communities>,
): number {
	const total_interactions =
		interaction_data.most_replied_to.reduce(
			(sum, [, count]) => sum + count,
			0,
		) +
		interaction_data.most_quoted.reduce(
			(sum, [, count]) => sum + count,
			0,
		) +
		interaction_data.most_mentioned.reduce(
			(sum, [, count]) => sum + count,
			0,
		);

	const community_factor = community_info.primary_communities.reduce(
		(sum, community) => sum + community.interaction_count,
		0,
	);

	return Math.min(
		1,
		total_interactions / 1000 + community_factor / 2000,
	);
}

function find_communities(
	interactions: Map<string, Set<string>>,
): Set<string>[] {
	const communities: Set<string>[] = [];
	const visited = new Set<string>();

	for (const [user] of interactions) {
		if (!visited.has(user)) {
			const community = new Set<string>();
			find_connected_users(user, interactions, visited, community);
			if (community.size > 1) {
				communities.push(community);
			}
		}
	}

	return communities;
}

function find_connected_users(
	user: string,
	interactions: Map<string, Set<string>>,
	visited: Set<string>,
	community: Set<string>,
) {
	visited.add(user);
	community.add(user);

	const connections = interactions.get(user) || new Set();
	for (const connected_user of connections) {
		if (!visited.has(connected_user)) {
			find_connected_users(
				connected_user,
				interactions,
				visited,
				community,
			);
		}
	}
}

function calculate_community_interactions(
	community: Set<string>,
	interactions: Map<string, Set<string>>,
): number {
	let count = 0;
	for (const user of community) {
		const user_interactions = interactions.get(user) || new Set();
		for (const other_user of user_interactions) {
			if (community.has(other_user)) {
				count++;
			}
		}
	}
	return count;
}
