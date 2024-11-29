import type { ProcessingStats } from '$lib/types';

export function chunk_array<T>(array: T[], size: number): T[][] {
	return Array.from(
		{ length: Math.ceil(array.length / size) },
		(_, i) => array.slice(i * size, i * size + size),
	);
}

export async function retry_with_backoff<T>(
	operation: () => Promise<T>,
	retries = 3,
	delay = 1000,
): Promise<T> {
	try {
		return await operation();
	} catch (error) {
		if (retries === 0) throw error;
		await new Promise((resolve) => setTimeout(resolve, delay));
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
