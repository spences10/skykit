import { get_db } from '#lib/db/index.js';

interface InactiveUserData {
	did: string;
	handle: string;
	last_post_date: string;
	post_count: number | null;
	followers_count: number | null;
	follows_back: boolean;
	created_at: string | null;
}

export async function execute_batch_update(
	updates: InactiveUserData[],
) {
	const db = get_db();
	db.exec('BEGIN');
	try {
		const placeholders = updates
			.map(() => '(?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?, ?)')
			.join(',');

		const args = updates.flatMap((u) => [
			u.did,
			u.handle,
			u.last_post_date,
			u.post_count,
			u.followers_count,
			u.follows_back ? 1 : 0,
			u.created_at,
		]);

		db.prepare(
			`
				INSERT INTO account_activity
				(did, handle, last_post_date, last_checked, post_count, followers_count, follows_back, created_at)
				VALUES ${placeholders}
				ON CONFLICT(did) DO UPDATE SET
					last_post_date = EXCLUDED.last_post_date,
					last_checked = CURRENT_TIMESTAMP,
					post_count = EXCLUDED.post_count,
					followers_count = EXCLUDED.followers_count,
					follows_back = EXCLUDED.follows_back,
					created_at = COALESCE(EXCLUDED.created_at, account_activity.created_at)
			`,
		).run(...args);
		db.exec('COMMIT');
	} catch (e: unknown) {
		db.exec('ROLLBACK');
		throw e;
	}
}
