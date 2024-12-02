import { api_status } from '$lib/api-status.svelte';
import { rate_limiter } from '$lib/rate-limiter';
import type { AnalysisResults, BskyProfile } from '$lib/types';
import { error } from '@sveltejs/kit';

interface ValidationError {
	field: string;
	message: string;
}

// Define the shape of the API response
interface ApiResponse extends AnalysisResults {
	profile: BskyProfile | null;
	cache_status?: {
		profile: string;
		feed: string;
		insights: string;
	};
}

// Export this as the PageData type
export type PageData = ApiResponse;

function validate_analysis_results(data: any): ValidationError[] {
	const errors: ValidationError[] = [];
	const required_sections = [
		'engagement',
		'content',
		'temporal',
		'network',
	];

	required_sections.forEach((section) => {
		if (!data[section]) {
			errors.push({
				field: section,
				message: `Missing ${section} data`,
			});
		}
	});

	if (data.temporal?.posting_frequency) {
		const { date_range } = data.temporal.posting_frequency;
		if (!date_range?.from || !date_range?.to) {
			errors.push({
				field: 'temporal.posting_frequency.date_range',
				message: 'Invalid date range',
			});
		}
	}

	return errors;
}

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
			throw await handle_error_response(response);
		}

		const data = await response.json();
		const validation_errors = validate_analysis_results(data);

		if (validation_errors.length > 0) {
			console.error('Validation errors:', validation_errors);
			throw error(500, 'Invalid response data format');
		}

		return data as ApiResponse;
	} catch (err: any) {
		handle_error(err);
	}
};

export const actions = {
	analyse_all: async ({ fetch, params }) => {
		const { handle } = params;
		try {
			const response = await fetch(
				`/api/user?handle=${encodeURIComponent(handle)}&full_analysis=true`,
			);

			if (!response.ok) {
				throw await handle_error_response(response);
			}

			const data = await response.json();
			const validation_errors = validate_analysis_results(data);

			if (validation_errors.length > 0) {
				console.error('Validation errors:', validation_errors);
				throw error(500, 'Invalid response data format');
			}

			return data as ApiResponse;
		} catch (err: any) {
			handle_error(err);
		}
	},
};

async function handle_error_response(response: Response) {
	const error_text = await response.text();
	let error_data;
	try {
		error_data = JSON.parse(error_text);
	} catch {
		error_data = { message: error_text };
	}

	const handler =
		error_handlers[response.status as keyof typeof error_handlers];
	if (handler) {
		throw handler(response, error_data);
	}

	throw error(
		response.status,
		error_data.message || 'An error occurred',
	);
}

function handle_error(err: any) {
	if (err?.status) throw err;
	console.error('Unexpected error:', err);
	throw error(500, 'An unexpected error occurred');
}
