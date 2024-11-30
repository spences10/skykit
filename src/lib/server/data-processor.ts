import type { InactiveFollow } from '$lib/types';
import type { AppBskyActorDefs, AtpAgent } from '@atproto/api';
import {
	filter_inactive_follows,
	process_accounts_in_chunks,
} from './activity/inactive-processor';
import { get_cached_accounts_by_did } from './db/account-cache';

export {
	filter_inactive_follows,
	get_cached_accounts_by_did,
	process_accounts_in_chunks,
};

// Re-export types that might be needed by consumers
export type { AppBskyActorDefs, AtpAgent, InactiveFollow };
