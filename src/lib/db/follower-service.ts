import { turso_client } from './client';

export const follower_service = {
	async get_last_cursor(
		user_did: string,
	): Promise<string | undefined> {
		const client = turso_client();
		const result = await client.execute({
			sql: `SELECT cursor FROM follower_cursors WHERE user_did = ?`,
			args: [user_did],
		});
		return result.rows[0]?.cursor as string | undefined;
	},

	async update_follower_snapshots(
		user_did: string,
		current_followers: string[],
	) {
		const client = turso_client();
		const timestamp = new Date().toISOString();

		// Begin transaction
		await client.execute({ sql: 'BEGIN TRANSACTION' });

		try {
			// Get existing current followers
			const existing = await client.execute({
				sql: `SELECT follower_did FROM follower_snapshots 
                      WHERE user_did = ? AND is_current = true`,
				args: [user_did],
			});

			const existing_followers = new Set(
				existing.rows.map((row) => row.follower_did as string),
			);
			const new_followers = new Set(current_followers);

			// Find unfollowers (in existing but not in current)
			const unfollowers = [...existing_followers].filter(
				(did) => !new_followers.has(did),
			);

			// Find new followers (in current but not in existing)
			const new_follows = [...new_followers].filter(
				(did) => !existing_followers.has(did),
			);

			// Mark unfollowers
			if (unfollowers.length > 0) {
				await client.execute({
					sql: `UPDATE follower_snapshots 
                          SET is_current = false, last_seen = ?
                          WHERE user_did = ? 
                          AND follower_did IN (${unfollowers.map(() => '?').join(',')})
                          AND is_current = true`,
					args: [timestamp, user_did, ...unfollowers],
				});
			}

			// Add new followers
			for (const follower_did of new_follows) {
				await client.execute({
					sql: `INSERT INTO follower_snapshots 
                          (user_did, follower_did, first_seen, last_seen, is_current)
                          VALUES (?, ?, ?, ?, true)`,
					args: [user_did, follower_did, timestamp, timestamp],
				});
			}

			// Update cursor
			await client.execute({
				sql: `INSERT INTO follower_cursors (user_did, cursor, updated_at)
                      VALUES (?, ?, ?)
                      ON CONFLICT (user_did) DO UPDATE 
                      SET cursor = excluded.cursor, updated_at = excluded.updated_at`,
				args: [user_did, timestamp, timestamp],
			});

			await client.execute({ sql: 'COMMIT' });
		} catch (error) {
			await client.execute({ sql: 'ROLLBACK' });
			throw error;
		}
	},
};
