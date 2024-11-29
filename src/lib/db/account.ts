import { get_db } from './connection';
import { chunk_array } from './utils';

export interface CachedAccount {
	did: string;
	handle: string;
	last_post_date: Date | null;
	last_checked: Date;
	post_count: number | null;
	followers_count: number | null;
	follows_back: boolean;
}

export const cache_account_activity = async (
	did: string,
	handle: string,
	last_post_date: string | null,
	post_count?: number,
	followers_count?: unknown,
	follows_back: boolean = false,
) => {
	const client = get_db();
	await client.execute({
		sql: `
			INSERT OR REPLACE INTO account_activity 
			(did, handle, last_post_date, last_checked, post_count, followers_count, follows_back) 
			VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)
		`,
		args: [
			did,
			handle,
			last_post_date,
			post_count || null,
			typeof followers_count === 'number' ? followers_count : null,
			follows_back,
		],
	});
};

export const get_cached_accounts_by_handles = async (
	handles: string[],
): Promise<CachedAccount[]> => {
	if (handles.length === 0) return [];

	const client = get_db();
	const CHUNK_SIZE = 1000;
	const all_results: CachedAccount[] = [];

	try {
		const tx = await client.transaction();

		for (const chunk of chunk_array(handles, CHUNK_SIZE)) {
			const placeholders = chunk.map(() => '?').join(',');
			const result = await tx.execute({
				sql: `SELECT * FROM account_activity WHERE handle IN (${placeholders})`,
				args: chunk,
			});

			all_results.push(
				...result.rows.map((row) => ({
					did: row.did as string,
					handle: row.handle as string,
					last_post_date: row.last_post_date
						? new Date(row.last_post_date as string)
						: null,
					last_checked: new Date(row.last_checked as string),
					post_count: row.post_count as number | null,
					followers_count: row.followers_count as number | null,
					follows_back: Boolean(row.follows_back),
				})),
			);
		}

		await tx.commit();
		return all_results;
	} catch (e) {
		console.error('Error fetching cached accounts:', e);
		throw e;
	}
};
