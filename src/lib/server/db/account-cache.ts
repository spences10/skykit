import { get_db } from '#lib/db/index.js';
import type { CachedAccount } from '#lib/types.js';
import { chunk_array } from '../utils';

export async function get_cached_accounts_by_did(
	dids: string[],
): Promise<CachedAccount[]> {
	if (dids.length === 0) return [];

	const client = get_db();
	const chunk_size = 1000;
	const all_results: CachedAccount[] = [];

	try {
		for (const chunk of chunk_array(dids, chunk_size)) {
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
				created_at: (row.created_at as string | null) ?? null,
			}));

			all_results.push(...chunk_results);
		}

		return all_results;
	} catch (e) {
		console.error('Error fetching cached accounts:', e);
		throw e;
	}
}

export function store_created_at(
	rows: Array<{ did: string; created_at: string }>,
) {
	if (rows.length === 0) return;
	const db = get_db();
	const statement = db.prepare(
		'UPDATE account_activity SET created_at = ? WHERE did = ?',
	);
	db.exec('BEGIN');
	try {
		for (const row of rows) statement.run(row.created_at, row.did);
		db.exec('COMMIT');
	} catch (e: unknown) {
		db.exec('ROLLBACK');
		throw e;
	}
}
