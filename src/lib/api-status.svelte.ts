import type { RateLimitStatus } from './rate-limiter';
import { rate_limiter } from './rate-limiter';

export function create_api_status() {
	let status = $state<RateLimitStatus>({
		remaining_requests: 100,
		queue_length: 0,
		is_limited: false,
		reset_time: undefined,
		max_requests: 100,
	});

	function update_status(new_status: RateLimitStatus) {
		status = { ...new_status };
	}

	function reset() {
		status = {
			remaining_requests: 100,
			queue_length: 0,
			is_limited: false,
			reset_time: undefined,
			max_requests: 100,
		};
	}

	// Set up the callback to receive updates from rate limiter
	rate_limiter.set_status_callback(update_status);

	return {
		get status() {
			return status;
		},
		update_status,
		reset,
	};
}

export const api_status = create_api_status();
