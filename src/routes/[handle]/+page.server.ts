import { api_status } from '$lib/api-status.svelte';
import { rate_limiter } from '$lib/rate-limiter';
import { error } from '@sveltejs/kit';

const error_handlers = {
	429: (response: Response, error_data: any) => {
		const reset_time = response.headers.get('retry-after');
		return error(
			429,
			`Rate limit exceeded. Try again in ${reset_time || 'a few'} seconds.`,
		);
	},
	400: (response: Response, error_data: any) => {
		if (
			error_data.message?.includes(
				'actor must be a valid did or a handle',
			)
		) {
			return error(
				400,
				'Invalid Bluesky handle. Please check and try again.',
			);
		}
		return error(400, error_data.message || 'Invalid request');
	},
	401: () => error(401, 'Authentication required'),
	403: () => error(403, 'Access forbidden'),
	404: () => error(404, 'User not found'),
} as const;

export const load = async ({ fetch, params }) => {
	const { handle } = params;

	try {
		const response = await fetch(
			`/api/user?handle=${encodeURIComponent(handle)}`,
		);

		const rate_limit_status = rate_limiter.get_status();
		api_status.update_status(rate_limit_status);

		if (!response.ok) {
			const error_text = await response.text();
			let error_data;
			try {
				error_data = JSON.parse(error_text);
			} catch {
				error_data = { message: error_text };
			}

			const handler =
				error_handlers[
					response.status as keyof typeof error_handlers
				];
			if (handler) {
				throw handler(response, error_data);
			}

			throw error(
				response.status,
				error_data.message || 'An error occurred',
			);
		}

		return await response.json();
	} catch (err: any) {
		if (err?.status) throw err;

		console.error('Unexpected error:', err);
		throw error(500, 'An unexpected error occurred');
	}
};
