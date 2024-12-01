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
	private queue: Array<{
		request: () => Promise<any>;
		resolve: (value: any) => void;
		reject: (error: any) => void;
	}> = [];
	private remainingRequests = 300;
	private resetTime?: Date;
	private maxRequests = 300;
	private statusUpdateCallback?: (status: RateLimitStatus) => void;
	private isProcessing = false;
	private readonly maxConcurrent = 10; // Increased from 5 to 10
	private activeRequests = 0;
	private readonly minRequestInterval = 50; // Decreased from 100ms to 50ms
	private readonly backoffThreshold = 0.15; // Decreased from 0.2 to 0.15

	set_status_callback(callback: (status: RateLimitStatus) => void) {
		this.statusUpdateCallback = callback;
	}

	private notify_status_update() {
		if (this.statusUpdateCallback) {
			this.statusUpdateCallback(this.get_status());
		}
	}

	private async processQueue() {
		if (this.isProcessing) return;
		this.isProcessing = true;

		while (this.queue.length > 0) {
			if (this.activeRequests >= this.maxConcurrent) {
				await new Promise((resolve) => setTimeout(resolve, 50)); // Decreased from 100ms to 50ms
				continue;
			}

			// Calculate dynamic delay based on remaining rate limit
			const remainingRatio =
				this.remainingRequests / this.maxRequests;
			let delay = this.minRequestInterval;
			if (remainingRatio < this.backoffThreshold) {
				// Less aggressive backoff
				delay =
					this.minRequestInterval *
					Math.pow(
						1.5,
						(this.backoffThreshold - remainingRatio) * 10,
					);
			}

			const nextRequest = this.queue.shift();
			if (nextRequest) {
				this.activeRequests++;
				this.executeRequest(nextRequest.request)
					.then((result) => {
						nextRequest.resolve(result);
						this.activeRequests--;
					})
					.catch((error) => {
						nextRequest.reject(error);
						this.activeRequests--;
					});

				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}

		this.isProcessing = false;
	}

	private async executeRequest<T>(
		request: () => Promise<T>,
	): Promise<T> {
		try {
			const response = await request();
			this.update_rate_limits(response);
			return response;
		} catch (error: any) {
			if (error?.status === 429) {
				const headers = error?.headers;
				if (headers) {
					this.update_rate_limits({ headers });
					// If rate limited, add request back to queue with higher priority
					return new Promise((resolve, reject) => {
						this.queue.unshift({ request, resolve, reject });
					});
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
		return new Promise((resolve, reject) => {
			this.queue.push({ request, resolve, reject });
			if (!this.isProcessing) {
				this.processQueue();
			}
		});
	}
}

export const rate_limiter = new RateLimiter();
