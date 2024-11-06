import type { BskyPost, NetworkAnalytics } from '../types';

export function analyse_network(posts: BskyPost[]): NetworkAnalytics {
	const interaction_network = build_interaction_network(posts);
	const community_detection = detect_communities(posts);

	return {
		interaction_network: {
			...interaction_network,
			frequent_conversations: [], // Add missing property
		},
		community_detection: {
			primary_communities:
				community_detection.primary_communities.map((c) => c.name),
			interaction_clusters: community_detection.primary_communities,
		},
	};
}

function build_interaction_network(posts: BskyPost[]) {
	const interactions = {
		most_replied_to: new Map<string, number>(),
		most_quoted: new Map<string, number>(),
		most_mentioned: new Map<string, number>(),
	};

	posts.forEach((post) => {
		// Track replies
		if (post.reply?.parent?.author?.handle) {
			const author = post.reply.parent.author.handle;
			interactions.most_replied_to.set(
				author,
				(interactions.most_replied_to.get(author) || 0) + 1,
			);
		}

		// Track quotes
		if (post.post.record?.['quote']?.author) {
			const author = post.post.record['quote'].author;
			interactions.most_quoted.set(
				author,
				(interactions.most_quoted.get(author) || 0) + 1,
			);
		}

		// Track mentions from text content
		const text = post.post.record?.text || '';
		const mentions = text.match(/(@\w+\.[\w.]+)/g) || [];
		mentions.forEach((mention) => {
			const handle = mention.slice(1); // Remove @ symbol
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

function detect_communities(posts: BskyPost[]) {
	const interactions = new Map<string, Set<string>>();

	posts.forEach((post) => {
		// Get the author of the current post
		const current_author = post.post.author.handle;

		// Add interactions from replies
		if (post.reply?.parent?.author?.handle) {
			add_interaction(
				interactions,
				current_author,
				post.reply.parent.author.handle,
			);
		}

		// Add interactions from mentions
		const text = post.post.record?.text || '';
		const mentions = text.match(/(@\w+\.[\w.]+)/g) || [];
		mentions.forEach((mention) => {
			const handle = mention.slice(1);
			add_interaction(interactions, current_author, handle);
		});
	});

	// Find groups with frequent interactions
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
				name: `Community of ${c.members[0]}`, // Use most active member as community name
				users: c.members,
				interaction_count: c.interaction_count,
			})),
	};
}

// Helper functions
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
