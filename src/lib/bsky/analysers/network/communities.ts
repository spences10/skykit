import type { BskyPost } from '$lib/types';
import type { AppBskyActorDefs } from '@atproto/api';
import { add_interaction } from './utils';

export function detect_communities(posts: BskyPost[]) {
	const interactions = build_interaction_map(posts);
	const communities = find_communities(interactions);

	return {
		primary_communities: process_communities(
			communities,
			interactions,
		),
	};
}

function build_interaction_map(posts: BskyPost[]) {
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

	return interactions;
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

function process_communities(
	communities: Set<string>[],
	interactions: Map<string, Set<string>>,
) {
	return communities
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
		}));
}
