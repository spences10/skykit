import { get_db } from '#lib/db/index.js';
import type { CachedAccount } from '#lib/types.js';
import { chunk_array } from '../utils';

export async function get_cached_accounts_by_did(
	dids: string[],
): Promise<CachedAccount[]> {
	if (dids.length === 0) return [];

	const client = get_db();
	const CHUNK_SIZE = 1000;
	const all_results: CachedAccount[] = [];

	try {
		for (const chunk of chunk_array(dids, CHUNK_SIZE)) {
			const placeholders = chunk.map(() => '?').join(',');
			const rows = client
				.prepare(
					`SELECT * FROM account_activity WHERE did IN (${placeholders})`,
				)
				.all(...chunk);

			const chunk_results = rows.map((row) => ({
				did: row.did as string,
				handle: row.handle as string,
				last_post_date: row.last_post_date
					? new Date(row.last_post_date as string)
					: null,
				last_checked: new Date(row.last_checked as string),
				post_count: row.post_count as number | null,
				followers_count: row.followers_count as number | null,
				follows_back: Boolean(row.follows_back),
			}));

			all_results.push(...chunk_results);
		}

		return all_results;
	} catch (e) {
		console.error('Error fetching cached accounts:', e);
		throw e;
	}
}
