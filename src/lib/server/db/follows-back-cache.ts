import { get_db } from '#lib/db/index.js';
import { chunk_array } from '../utils';

const follows_back_freshness_days = 7;

/** Fresh follows-back values for one viewer, keyed by followed DID. */
export function get_cached_follows_back(
	viewer_did: string,
	dids: string[],
): Map<string, boolean> {
	const result = new Map<string, boolean>();
	const db = get_db();

	for (const chunk of chunk_array(dids, 900)) {
		const placeholders = chunk.map(() => '?').join(',');
		const rows = db
			.prepare(
				`SELECT did, follows_back FROM follows_back_cache
				WHERE viewer_did = ?
					AND did IN (${placeholders})
					AND checked_at > datetime('now', ?)`,
			)
			.all(
				viewer_did,
				...chunk,
				`-${follows_back_freshness_days} days`,
			);
		for (const row of rows) {
			result.set(row.did as string, Boolean(row.follows_back));
		}
	}
	return result;
}

export function store_follows_back(
	viewer_did: string,
	values: Map<string, boolean>,
) {
	if (values.size === 0) return;
	const db = get_db();
	const statement = db.prepare(
		`INSERT INTO follows_back_cache (viewer_did, did, follows_back, checked_at)
		VALUES (?, ?, ?, CURRENT_TIMESTAMP)
		ON CONFLICT(viewer_did, did) DO UPDATE SET
			follows_back = EXCLUDED.follows_back,
			checked_at = CURRENT_TIMESTAMP`,
	);
	db.exec('BEGIN');
	try {
		for (const [did, follows_back] of values) {
			statement.run(viewer_did, did, follows_back ? 1 : 0);
		}
		db.exec('COMMIT');
	} catch (e: unknown) {
		db.exec('ROLLBACK');
		throw e;
	}
}
