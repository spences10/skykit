export const profile_chunk_size = 25;
export const feed_chunk_size = 100;
export const delay_between_batches = 100;

export interface FeedOptions {
	filter:
		| 'posts_no_replies'
		| 'posts_with_replies'
		| 'posts_and_author_threads';
	limit: number;
}
