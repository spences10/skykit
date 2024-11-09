import type { RateLimitStatus } from './rate-limiter';

export function create_api_status() {
	let status = $state<RateLimitStatus>({
		remaining_requests: 100,
		queue_length: 0,
		is_limited: false,
		reset_time: undefined,
	});

	function update_status(new_status: RateLimitStatus) {
		status = { ...new_status };
	}

	return {
		get status() {
			return status;
		},
		update_status,
	};
}

export const api_status = create_api_status();
