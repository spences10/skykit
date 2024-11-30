import type { BskyPost } from '$lib/types';
import type { AppBskyActorDefs } from '@atproto/api';
import { map_to_sorted_array } from './utils';

export function build_interaction_network(posts: BskyPost[]) {
	const interactions = {
		most_replied_to: new Map<string, number>(),
		most_quoted: new Map<string, number>(),
		most_mentioned: new Map<string, number>(),
	};

	posts.forEach((post) => {
		track_replies(post, interactions.most_replied_to);
		track_quotes(post, interactions.most_quoted);
		track_mentions(post, interactions.most_mentioned);
	});

	return {
		most_replied_to: map_to_sorted_array(
			interactions.most_replied_to,
		),
		most_quoted: map_to_sorted_array(interactions.most_quoted),
		most_mentioned: map_to_sorted_array(interactions.most_mentioned),
	};
}

function track_replies(
	post: BskyPost,
	reply_map: Map<string, number>,
) {
	const reply_author = (
		post.reply?.parent?.author as AppBskyActorDefs.ProfileViewBasic
	)?.handle;
	if (reply_author && reply_author !== post.post.author.handle) {
		reply_map.set(
			reply_author,
			(reply_map.get(reply_author) || 0) + 1,
		);
	}
}

function track_quotes(
	post: BskyPost,
	quote_map: Map<string, number>,
) {
	const quote_author = (post.post.record as any).quote?.author;
	if (quote_author) {
		quote_map.set(
			quote_author,
			(quote_map.get(quote_author) || 0) + 1,
		);
	}
}

function track_mentions(
	post: BskyPost,
	mention_map: Map<string, number>,
) {
	const text = (post.post.record as any).text || '';
	const mentions = text.match(/(@\w+\.[\w.]+)/g) || [];
	mentions.forEach((mention: string) => {
		const handle = mention.slice(1);
		mention_map.set(handle, (mention_map.get(handle) || 0) + 1);
	});
}
