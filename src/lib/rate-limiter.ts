interface RateLimitHeaders {
	'ratelimit-remaining'?: string;
	'ratelimit-reset'?: string;
}

export interface RateLimitStatus {
	remaining_requests: number;
	queue_length: number;
	is_limited: boolean;
	reset_time?: Date;
}

export class RateLimiter {
	private queue: Array<() => Promise<any>> = [];
	private processing = false;
	private lastRequestTime = 0;
	private remainingRequests = 100; // BlueskyAPI default
	private resetTime = 0;
	private minRequestInterval = 1000; // Minimum 1 second between requests

	async addToQueue<T>(request: () => Promise<T>): Promise<T> {
		return new Promise((resolve, reject) => {
			this.queue.push(async () => {
				try {
					const result = await this.execute_with_backoff(() =>
						request(),
					);
					resolve(result);
				} catch (error) {
					reject(error);
				}
			});

			this.processQueue();
		});
	}

	private async processQueue() {
		if (this.processing || this.queue.length === 0) return;

		this.processing = true;

		while (this.queue.length > 0) {
			const now = Date.now();

			// Check if we need to wait for rate limit reset
			if (this.remainingRequests <= 0 && now < this.resetTime) {
				const waitTime = this.resetTime - now;
				await new Promise((resolve) => setTimeout(resolve, waitTime));
			}

			// Ensure minimum interval between requests
			const timeSinceLastRequest = now - this.lastRequestTime;
			if (timeSinceLastRequest < this.minRequestInterval) {
				await new Promise((resolve) =>
					setTimeout(
						resolve,
						this.minRequestInterval - timeSinceLastRequest,
					),
				);
			}

			const request = this.queue.shift();
			if (request) {
				await request();
			}
		}

		this.processing = false;
	}

	private async execute_with_backoff<T>(
		request: () => Promise<T>,
		retryCount = 0,
	): Promise<T> {
		try {
			const response = await request();
			this.update_rate_limits(response);
			this.lastRequestTime = Date.now();
			return response;
		} catch (error: any) {
			if (error?.status === 429 && retryCount < 3) {
				const resetTime = error?.headers?.['ratelimit-reset'];
				if (resetTime) {
					this.resetTime = Number(resetTime) * 1000;
					this.remainingRequests = 0;
				}

				const backoffTime = Math.min(
					1000 * Math.pow(2, retryCount),
					this.resetTime - Date.now(),
				);

				await new Promise((resolve) =>
					setTimeout(resolve, backoffTime),
				);
				return this.execute_with_backoff(request, retryCount + 1);
			}
			throw error;
		}
	}

	private update_rate_limits(response: any) {
		if (!response?.headers) return;

		const remaining = response.headers['ratelimit-remaining'];
		const reset = response.headers['ratelimit-reset'];

		if (remaining) {
			this.remainingRequests = Number(remaining);
		}
		if (reset) {
			this.resetTime = Number(reset) * 1000;
		}
	}

	get_status(): RateLimitStatus {
		return {
			remaining_requests: this.remainingRequests,
			queue_length: this.queue.length,
			is_limited: this.remainingRequests <= 0,
			reset_time: this.resetTime ? new Date(this.resetTime) : undefined
		};
	}
}

// Create a singleton instance
export const rate_limiter = new RateLimiter();
