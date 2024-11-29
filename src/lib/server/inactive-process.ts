import { get_db } from '$lib/db';
import type { Value } from '@libsql/client';

interface InactiveUserData {
	did: string;
	handle: string;
	last_post_date: string;
	post_count: number | null;
	followers_count: number | null;
	follows_back: boolean;
}

export async function execute_batch_update(
	updates: InactiveUserData[],
) {
	const db = get_db();
	const tx = await db.transaction();
	try {
		const placeholders = updates
			.map(() => '(?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)')
			.join(',');

		const args = updates.flatMap(
			(u) =>
				[
					u.did,
					u.handle,
					u.last_post_date,
					u.post_count,
					u.followers_count,
					u.follows_back,
				] as Value[],
		);

		await tx.execute({
			sql: `
				INSERT INTO account_activity 
				(did, handle, last_post_date, last_checked, post_count, followers_count, follows_back)
				VALUES ${placeholders}
				ON CONFLICT(did) DO UPDATE SET
					last_post_date = EXCLUDED.last_post_date,
					last_checked = CURRENT_TIMESTAMP,
					post_count = EXCLUDED.post_count,
					followers_count = EXCLUDED.followers_count,
					follows_back = EXCLUDED.follows_back
			`,
			args,
		});
		await tx.commit();
	} catch (e: unknown) {
		await tx.rollback();
		throw e;
	}
}
