export type RateLimitStatus = {
	remaining_requests: number;
	reset_time?: Date;
	max_requests: number;
	is_healthy: boolean;
	retry_after?: number;
	queue_length: number;
	is_limited: boolean;
};

export class RateLimiter {
	private queue: Array<() => Promise<any>> = [];
	private processing = false;
	private lastRequestTime = 0;
	private remainingRequests = 300;
	private resetTime = 0;
	private maxRequests = 300;
	private statusUpdateCallback?: (status: RateLimitStatus) => void;

	set_status_callback(callback: (status: RateLimitStatus) => void) {
		this.statusUpdateCallback = callback;
	}

	private notify_status_update() {
		if (this.statusUpdateCallback) {
			this.statusUpdateCallback(this.get_status());
		}
	}

	async execute_request<T>(request: () => Promise<T>): Promise<T> {
		try {
			const response = await request();
			this.update_rate_limits(response);
			this.lastRequestTime = Date.now();
			return response;
		} catch (error: any) {
			if (error?.status === 429) {
				const headers = error?.headers;
				if (headers) {
					this.update_rate_limits({ headers });
				}
			}
			throw error;
		}
	}

	private update_rate_limits(response: any) {
		if (!response?.headers) return;

		const remaining = response.headers['ratelimit-remaining'];
		const reset = response.headers['ratelimit-reset'];
		const limit = response.headers['ratelimit-limit'];

		if (remaining !== undefined) {
			this.remainingRequests = Number(remaining);
		}
		if (reset) {
			this.resetTime = Number(reset) * 1000; // Convert to milliseconds
		}
		if (limit) {
			this.maxRequests = Number(limit);
		}

		this.notify_status_update();
	}

	get_status(): RateLimitStatus {
		return {
			remaining_requests: this.remainingRequests,
			is_healthy: this.remainingRequests > 0,
			is_limited: this.remainingRequests <= 0,
			queue_length: this.queue.length,
			reset_time: this.resetTime
				? new Date(this.resetTime)
				: undefined,
			max_requests: this.maxRequests,
		};
	}

	// Track rate limits from response headers
	async process_response(response: Response) {
		const status: RateLimitStatus = {
			remaining_requests: parseInt(
				response.headers.get('x-ratelimit-remaining') ||
					response.headers.get('ratelimit-remaining') ||
					'300',
			),
			max_requests: parseInt(
				response.headers.get('x-ratelimit-limit') ||
					response.headers.get('ratelimit-limit') ||
					'300',
			),
			is_healthy: response.ok && response.status !== 429,
			retry_after: parseInt(
				response.headers.get('retry-after') || '0',
			),
			reset_time: new Date(
				response.headers.get('x-ratelimit-reset') ||
					response.headers.get('ratelimit-reset') ||
					Date.now() + 300000,
			),
			queue_length: this.queue.length,
			is_limited: this.remainingRequests <= 0,
		};

		if (this.statusUpdateCallback) {
			this.statusUpdateCallback(status);
		}

		return status;
	}

	async add_to_queue<T>(request: () => Promise<T>): Promise<T> {
		return this.execute_request(request);
	}
}

export const rate_limiter = new RateLimiter();
