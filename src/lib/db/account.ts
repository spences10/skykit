import { chunk_array } from '#lib/db/utils.js';
import type { CachedAccount } from '#lib/types.js';
import { get_db } from './connection';

export const cache_account_activity = async (
	did: string,
	handle: string,
	last_post_date: string | null,
	post_count?: number,
	followers_count?: unknown,
	follows_back: boolean = false,
) => {
	get_db()
		.prepare(
			`
			INSERT OR REPLACE INTO account_activity
			(did, handle, last_post_date, last_checked, post_count, followers_count, follows_back)
			VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, ?, ?)
		`,
		)
		.run(
			did,
			handle,
			last_post_date,
			post_count || null,
			typeof followers_count === 'number' ? followers_count : null,
			follows_back ? 1 : 0,
		);
};

export const get_cached_accounts_by_handles = async (
	handles: string[],
): Promise<CachedAccount[]> => {
	if (handles.length === 0) return [];

	const client = get_db();
	const chunk_size = 1000;
	const all_results: CachedAccount[] = [];

	try {
		for (const chunk of chunk_array(handles, chunk_size)) {
			const placeholders = chunk.map(() => '?').join(',');
			const rows = client
				.prepare(
					`SELECT * FROM account_activity WHERE handle IN (${placeholders})`,
				)
				.all(...chunk);

			all_results.push(
				...rows.map((row) => ({
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

		return all_results;
	} catch (e) {
		console.error('Error fetching cached accounts:', e);
		throw e;
	}
};
