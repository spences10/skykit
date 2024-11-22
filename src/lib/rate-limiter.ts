import { addSeconds, isFuture } from 'date-fns';

export type RateLimitStatus = {
	remaining_requests: number;
	reset_time?: Date;
	max_requests: number;
	is_healthy: boolean;
	queue_length: number;
	is_limited: boolean;
};

export class RateLimiter {
	private queue: Array<() => Promise<any>> = [];
	private remainingRequests = 300;
	private resetTime?: Date;
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
			this.resetTime = addSeconds(new Date(), Number(reset));
		}
		if (limit) {
			this.maxRequests = Number(limit);
		}

		this.notify_status_update();
	}

	get_status(): RateLimitStatus {
		if (this.resetTime && isFuture(this.resetTime)) {
			this.remainingRequests = this.maxRequests;
			this.resetTime = undefined;
		}

		return {
			remaining_requests: this.remainingRequests,
			is_healthy: this.remainingRequests > 0,
			is_limited: this.remainingRequests <= 0,
			queue_length: this.queue.length,
			reset_time: this.resetTime,
			max_requests: this.maxRequests,
		};
	}

	async add_to_queue<T>(request: () => Promise<T>): Promise<T> {
		return this.execute_request(request);
	}
}

export const rate_limiter = new RateLimiter();
