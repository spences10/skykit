export const PROFILE_CHUNK_SIZE = 25;
export const FEED_CHUNK_SIZE = 100;
export const DELAY_BETWEEN_BATCHES = 100;
export const RECENT_ACTIVITY_THRESHOLD = 30;

export interface FeedOptions {
	filter:
		| 'posts_no_replies'
		| 'posts_with_replies'
		| 'posts_and_author_threads';
	limit: number;
}
