import { get_db } from '#lib/db/index.js';
import type { AppBskyActorDefs } from '@atproto/api';
import { differenceInMinutes } from 'date-fns';

export type FollowSummary = Pick<
	AppBskyActorDefs.ProfileView,
	'did' | 'handle' | 'displayName'
>;

const follow_list_freshness_minutes = 60;

export function get_cached_follow_list(
	did: string,
): FollowSummary[] | null {
	const row = get_db()
		.prepare(
			'SELECT follows, fetched_at FROM follow_list_cache WHERE did = ?',
		)
		.get(did);
	if (!row) return null;

	// SQLite CURRENT_TIMESTAMP is UTC without a zone marker
	const fetched_at = new Date(`${row.fetched_at as string}Z`);
	const age = differenceInMinutes(new Date(), fetched_at);
	if (age >= follow_list_freshness_minutes) return null;

	return JSON.parse(row.follows as string) as FollowSummary[];
}

export function store_follow_list(
	did: string,
	follows: FollowSummary[],
) {
	const summaries = follows.map((follow) => ({
		did: follow.did,
		handle: follow.handle,
		displayName: follow.displayName,
	}));
	get_db()
		.prepare(
			`INSERT INTO follow_list_cache (did, follows, fetched_at)
			VALUES (?, ?, CURRENT_TIMESTAMP)
			ON CONFLICT(did) DO UPDATE SET
				follows = EXCLUDED.follows,
				fetched_at = CURRENT_TIMESTAMP`,
		)
		.run(did, JSON.stringify(summaries));
}
