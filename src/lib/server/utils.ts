import type { ProcessingStats } from '$lib/types';

export function chunk_array<T>(array: T[], size: number): T[][] {
	return Array.from(
		{ length: Math.ceil(array.length / size) },
		(_, i) => array.slice(i * size, i * size + size),
	);
}

// Add jitter to prevent thundering herd
function get_jitter(base_delay: number): number {
    const jitter = Math.random() * 0.3 - 0.15; // ±15% jitter
    return base_delay * (1 + jitter);
}

export async function retry_with_backoff<T>(
	operation: () => Promise<T>,
	retries = 5, // Increased from 3 to 5
	delay = 2000, // Increased from 1000 to 2000
): Promise<T> {
	try {
		return await operation();
	} catch (error: any) {
		if (retries === 0) throw error;

		// Handle network timeouts specifically
		if (error?.cause?.code === 'ETIMEDOUT' || error?.status === 1) {
			console.log(`Network timeout, retrying... (${retries} attempts remaining)`);
			const jittered_delay = get_jitter(delay);
			await new Promise((resolve) => setTimeout(resolve, jittered_delay));
			return retry_with_backoff(operation, retries - 1, delay * 2);
		}

		// Handle rate limits differently - use a longer delay
		if (error?.status === 429) {
			const reset_after = parseInt(error?.headers?.['retry-after'] || '60', 10);
			const rate_limit_delay = reset_after * 1000;
			await new Promise((resolve) => setTimeout(resolve, rate_limit_delay));
			return retry_with_backoff(operation, retries - 1, delay);
		}

		// For other errors, use standard exponential backoff
		await new Promise((resolve) => setTimeout(resolve, get_jitter(delay)));
		return retry_with_backoff(operation, retries - 1, delay * 2);
	}
}

export const report_progress = (
	controller: ReadableStreamDefaultController,
	stats: Partial<ProcessingStats>,
) => {
	const encoder = new TextEncoder();
	controller.enqueue(
		encoder.encode(
			`data: ${JSON.stringify({
				type: 'progress',
				...stats,
			})}\n\n`,
		),
	);
};
