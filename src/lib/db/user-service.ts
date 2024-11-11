import type { BskyProfile } from '$lib/bsky/types';
import type { AppBskyFeedDefs } from '@atproto/api';
import { turso_client } from './client';

export const user_service = {
	async upsert_user(profile: BskyProfile) {
		const client = turso_client();

		// Add rate limiting for metrics snapshots (only store if 1 hour has passed)
		const last_metric = await client.execute({
			sql: `SELECT recorded_at FROM user_metrics 
				  WHERE user_did = ? 
				  ORDER BY recorded_at DESC LIMIT 1`,
			args: [profile.did],
		});

		const should_record_metrics =
			!last_metric.rows.length ||
			Date.now() -
				new Date(
					last_metric.rows[0].recorded_at as string,
				).getTime() >
				3600000;

		await client.execute({
			sql: `INSERT INTO users (did, handle, display_name, description, avatar)
				  VALUES (?, ?, ?, ?, ?) 
				  ON CONFLICT (did) DO UPDATE SET
					handle = excluded.handle,
					display_name = excluded.display_name,
					description = excluded.description,
					avatar = excluded.avatar,
					last_updated = CURRENT_TIMESTAMP`,
			args: [
				profile.did,
				profile.handle,
				profile.displayName || null,
				profile.description || null,
				profile.avatar || null,
			],
		});

		if (should_record_metrics) {
			await client.execute({
				sql: `INSERT INTO user_metrics 
					  (user_did, followers_count, following_count, posts_count, recorded_at)
					  VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
				args: [
					profile.did,
					profile.followersCount,
					profile.followsCount,
					profile.postsCount,
				],
			});
		}
	},

	async store_posts(
		user_did: string,
		posts: AppBskyFeedDefs.FeedViewPost[],
	) {
		const client = turso_client();

		for (const post of posts) {
			const post_view = post.post;
			if (!post_view?.uri) continue;

			// Store the post
			await client.execute({
				sql: `INSERT INTO posts (uri, user_did, text, indexed_at, has_media, has_links, reply_parent, quote_uri)
					  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
					  ON CONFLICT (uri) DO NOTHING`,
				args: [
					post_view.uri,
					user_did,
					post_view.record.text || '',
					post_view.indexedAt,
					post_view.embed?.images?.length > 0 || false,
					post_view.embed?.external ? true : false,
					post_view.record.reply?.parent.uri || null,
					post_view.record.embed?.record?.uri || null,
				],
			});

			// Store metrics
			await client.execute({
				sql: `INSERT INTO post_metrics (post_uri, likes_count, replies_count, reposts_count, recorded_at)
					  VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
				args: [
					post_view.uri,
					post_view.likeCount || 0,
					post_view.replyCount || 0,
					post_view.repostCount || 0,
				],
			});
		}
	},

	async get_unfollowers(
		user_did: string,
	): Promise<
		Array<{ did: string; handle: string; unfollowed_at: string }>
	> {
		const client = turso_client();
		const result = await client.execute({
			sql: `SELECT u.did, u.handle, fs.last_seen as unfollowed_at
							FROM follower_snapshots fs
							JOIN users u ON fs.follower_did = u.did
							WHERE fs.user_did = ? 
							AND fs.is_current = false
							ORDER BY fs.last_seen DESC`,
			args: [user_did],
		});

		return result.rows as Array<{
			did: string;
			handle: string;
			unfollowed_at: string;
		}>;
	},
};
