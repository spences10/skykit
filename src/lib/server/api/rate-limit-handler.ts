interface ApiError extends Error {
	status?: number;
	headers?: {
		'retry-after'?: string;
	};
	cause?: {
		code?: string;
	};
}

export async function handle_rate_limit_error(
	error: ApiError,
): Promise<void> {
	if (error?.status === 429) {
		const reset_after = parseInt(
			error?.headers?.['retry-after'] || '60',
			10,
		);
		await new Promise((resolve) =>
			setTimeout(resolve, reset_after * 1000),
		);
	} else {
		throw error;
	}
}
