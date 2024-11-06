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
					const result = await this.executeWithBackoff(request);
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

	private async executeWithBackoff<T>(
		request: () => Promise<T>,
		retryCount = 0,
	): Promise<T> {
		try {
			const response = await request();
			this.updateRateLimits(response);
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
				return this.executeWithBackoff(request, retryCount + 1);
			}
			throw error;
		}
	}

	private updateRateLimits(response: any) {
		const headers = response?.headers;
		if (headers) {
			this.remainingRequests = Number(
				headers['ratelimit-remaining'] || 100,
			);
			const resetTime = headers['ratelimit-reset'];
			if (resetTime) {
				this.resetTime = Number(resetTime) * 1000;
			}
		}
	}
}

// Create a singleton instance
export const rateLimiter = new RateLimiter();
