import { rate_limiter } from '#lib/rate-limiter.js';
import type { AppBskyActorDefs } from '@atproto/api';
import { AppBskyGraphDefs, AtpAgent } from '@atproto/api';
import {
	chunk_array,
	report_progress,
	retry_with_backoff,
} from './utils';

export const public_api = 'https://public.api.bsky.app';
export const agent = new AtpAgent({ service: public_api });

const max_actors_per_request = 25;
const max_relationships_per_request = 30;
const delay_between_chunks = 500;
const max_retries = 3;

export type FeedFilter =
	| 'posts_no_replies'
	| 'posts_with_replies'
	| 'posts_and_author_threads';

interface ApiError extends Error {
	status?: number;
	headers?: {
		'retry-after'?: string;
	};
}

async function handle_rate_limit(error: ApiError): Promise<void> {
	if (error?.status === 429) {
		const reset_after = parseInt(
			error?.headers?.['retry-after'] || '60',
			10,
		);
		await new Promise((resolve) =>
			setTimeout(resolve, reset_after * 1000),
		);
	} else {
		throw error;
	}
}

export async function get_profile(handle: string) {
	try {
		return await rate_limiter.add_to_queue(() =>
			agent.api.app.bsky.actor.getProfile({
				actor: handle || '',
			}),
		);
	} catch (error) {
		const api_error = error as ApiError;
		if (api_error.status === 429) {
			await handle_rate_limit(api_error);
			return get_profile(handle);
		}
		throw error;
	}
}

export async function batch_check_follows_back(
	viewer_did: string,
	target_dids: string[],
): Promise<Map<string, boolean>> {
	const follows_map = new Map<string, boolean>();
	const chunks = chunk_array(
		target_dids,
		max_relationships_per_request,
	);
	let retries = 0;

	for (const chunk of chunks) {
		try {
			const response = await rate_limiter.add_to_queue(() =>
				agent.api.app.bsky.graph.getRelationships({
					actor: viewer_did,
					others: chunk,
				}),
			);

			for (const relationship of response.data.relationships) {
				if (AppBskyGraphDefs.isRelationship(relationship)) {
					follows_map.set(
						relationship.did,
						Boolean(relationship.followedBy),
					);
				}
			}

			retries = 0; // Reset retries on success
		} catch (error) {
			const api_error = error as ApiError;
			if (api_error.status === 429) {
				await handle_rate_limit(api_error);
				retries++;
				if (retries < max_retries) {
					// Retry this chunk
					chunks.unshift(chunk);
					continue;
				}
			}
			throw error;
		}
	}

	return follows_map;
}

export async function get_all_follows_for_user(
	agent: AtpAgent,
	did: string,
	total_follows: number,
	controller?: ReadableStreamDefaultController,
): Promise<AppBskyActorDefs.ProfileView[]> {
	const all_follows: AppBskyActorDefs.ProfileView[] = [];
	let cursor: string | undefined;
	let retries = 0;

	do {
		try {
			const follows = await rate_limiter.add_to_queue(() =>
				agent.api.app.bsky.graph.getFollows({
					actor: did,
					limit: 100,
					cursor,
				}),
			);

			if (!follows.data.follows) break;
			all_follows.push(...follows.data.follows);
			cursor = follows.data.cursor;

			if (cursor) {
				await new Promise((resolve) =>
					setTimeout(resolve, delay_between_chunks),
				);
			}

			if (controller) {
				report_progress(controller, {
					stage: 'follows',
					processed: all_follows.length,
					total: total_follows,
					current: `Fetching follows: ${all_follows.length}/${total_follows}`,
					data_source: 'api',
					current_batch_source: 'Fetching follows from Bluesky API',
					cache_hits: 0,
					cache_misses: 0,
				});
			}

			retries = 0; // Reset retries on success
		} catch (error) {
			const api_error = error as ApiError;
			if (api_error.status === 429) {
				await handle_rate_limit(api_error);
				retries++;
				if (retries < max_retries) {
					continue;
				}
			}
			throw error;
		}
	} while (cursor && retries < max_retries);

	return all_follows;
}

export async function get_profiles_in_chunks(
	dids: string[],
	controller?: ReadableStreamDefaultController,
): Promise<Map<string, AppBskyActorDefs.ProfileViewDetailed>> {
	const chunks = chunk_array(dids, max_actors_per_request);
	const profile_map = new Map<
		string,
		AppBskyActorDefs.ProfileViewDetailed
	>();
	let processed = 0;
	let retries = 0;

	for (const chunk of chunks) {
		try {
			const profiles = await retry_with_backoff(() =>
				rate_limiter.add_to_queue(() =>
					agent.api.app.bsky.actor.getProfiles({
						actors: chunk,
					}),
				),
			);

			for (const profile of profiles.data.profiles) {
				profile_map.set(profile.did, profile);
			}

			processed += chunk.length;
			if (controller) {
				report_progress(controller, {
					stage: 'profiles',
					processed,
					total: dids.length,
					current: 'Fetching profile data...',
					data_source: 'api',
					current_batch_source: 'Fetching profiles from Bluesky API',
					cache_hits: 0,
					cache_misses: 0,
				});
			}

			if (chunks.length > 1) {
				await new Promise((resolve) =>
					setTimeout(resolve, delay_between_chunks),
				);
			}

			retries = 0; // Reset retries on success
		} catch (error) {
			const api_error = error as ApiError;
			if (api_error.status === 429) {
				await handle_rate_limit(api_error);
				retries++;
				if (retries < max_retries) {
					// Retry this chunk
					chunks.unshift(chunk);
					continue;
				}
			}
			throw error;
		}
	}

	return profile_map;
}
