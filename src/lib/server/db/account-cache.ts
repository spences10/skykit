import { get_db } from '$lib/db';
import type { CachedAccount } from '$lib/types';
import type { Value } from '@libsql/client';
import { chunk_array } from '../utils';

export async function get_cached_accounts_by_did(
	dids: string[],
): Promise<CachedAccount[]> {
	if (dids.length === 0) return [];

	const client = get_db();
	const CHUNK_SIZE = 1000;
	const all_results: CachedAccount[] = [];

	try {
		const tx = await client.transaction();

		for (const chunk of chunk_array(dids, CHUNK_SIZE)) {
			const placeholders = chunk.map(() => '?').join(',');
			const result = await tx.execute({
				sql: `SELECT * FROM account_activity WHERE did IN (${placeholders})`,
				args: chunk as Value[],
			});

			const chunk_results = result.rows.map((row) => ({
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

		await tx.commit();
		return all_results;
	} catch (e) {
		console.error('Error fetching cached accounts:', e);
		throw e;
	}
}
