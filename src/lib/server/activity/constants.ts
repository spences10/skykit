export const profile_chunk_size = 25;
export const feed_chunk_size = 100;
// Chunks fetched at the same time on a cold run
export const chunk_concurrency = 3;
export const max_chunk_attempts = 3;

export interface FeedOptions {
	filter:
		| 'posts_no_replies'
		| 'posts_with_replies'
		| 'posts_and_author_threads';
	limit: number;
}
