import type { BskyPost } from '$lib/types';

export function sum_interactions(
	interactions: Array<[string, number]>,
): number {
	return interactions.reduce((sum, [, count]) => sum + count, 0);
}

export function sum_post_metric(
	posts: BskyPost[],
	metric: 'likeCount' | 'repostCount' | 'replyCount',
): number {
	return posts.reduce(
		(sum, post) => sum + (post.post[metric] ?? 0),
		0,
	);
}

export function map_to_sorted_array(
	map: Map<string, number>,
): Array<[string, number]> {
	return Array.from(map.entries())
		.sort(([, a], [, b]) => b - a)
		.slice(0, 10);
}

export function add_interaction(
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
