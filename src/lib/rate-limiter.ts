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
	private remaining_requests = 300;
	private reset_time?: Date;
	private max_requests = 300;
	private status_update_callback?: (status: RateLimitStatus) => void;
	private is_processing = false;
	private readonly max_concurrent = 10; // Increased from 5 to 10
	private active_requests = 0;
	private readonly min_request_interval = 50; // Decreased from 100ms to 50ms
	private readonly backoff_threshold = 0.15; // Decreased from 0.2 to 0.15

	set_status_callback(callback: (status: RateLimitStatus) => void) {
		this.status_update_callback = callback;
	}

	private notify_status_update() {
		if (this.status_update_callback) {
			this.status_update_callback(this.get_status());
		}
	}

	private async process_queue() {
		if (this.is_processing) return;
		this.is_processing = true;

		while (this.queue.length > 0) {
			if (this.active_requests >= this.max_concurrent) {
				await new Promise((resolve) => setTimeout(resolve, 50)); // Decreased from 100ms to 50ms
				continue;
			}

			// Calculate dynamic delay based on remaining rate limit
			const remaining_ratio =
				this.remaining_requests / this.max_requests;
			let delay = this.min_request_interval;
			if (remaining_ratio < this.backoff_threshold) {
				// Less aggressive backoff
				delay =
					this.min_request_interval *
					Math.pow(
						1.5,
						(this.backoff_threshold - remaining_ratio) * 10,
					);
			}

			const next_request = this.queue.shift();
			if (next_request) {
				this.active_requests++;
				this.execute_request(next_request.request)
					.then((result) => {
						next_request.resolve(result);
						this.active_requests--;
					})
					.catch((error) => {
						next_request.reject(error);
						this.active_requests--;
					});

				await new Promise((resolve) => setTimeout(resolve, delay));
			}
		}

		this.is_processing = false;
	}

	private async execute_request<T>(
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
			this.remaining_requests = Number(remaining);
		}
		if (reset) {
			this.reset_time = addSeconds(new Date(), Number(reset));
		}
		if (limit) {
			this.max_requests = Number(limit);
		}

		this.notify_status_update();
	}

	get_status(): RateLimitStatus {
		if (this.reset_time && isFuture(this.reset_time)) {
			this.remaining_requests = this.max_requests;
			this.reset_time = undefined;
		}

		return {
			remaining_requests: this.remaining_requests,
			is_healthy: this.remaining_requests > 0,
			is_limited: this.remaining_requests <= 0,
			queue_length: this.queue.length,
			reset_time: this.reset_time,
			max_requests: this.max_requests,
		};
	}

	async add_to_queue<T>(request: () => Promise<T>): Promise<T> {
		return new Promise((resolve, reject) => {
			this.queue.push({ request, resolve, reject });
			if (!this.is_processing) {
				void this.process_queue();
			}
		});
	}
}

export const rate_limiter = new RateLimiter();
