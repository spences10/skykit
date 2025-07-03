import type { InactiveFollow } from '$lib/types';
import { error } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

interface ActionSuccess {
	success: true;
	inactive_follows: InactiveFollow[];
}

interface ActionError {
	success: false;
	error: string;
}

export const load = (async ({ fetch, params }) => {
	const { handle } = params;

	try {
		const profile_response = await fetch(
			`/api/user?handle=${encodeURIComponent(handle)}`,
		);

		if (!profile_response.ok) {
			throw error(
				profile_response.status,
				'Failed to fetch user data',
			);
		}

		const { profile } = await profile_response.json();

		return {
			profile,
			engagement: null,
			content: null,
			temporal: null,
			network: null,
			account_classification: [],
			behavioural_insights: [],
			content_strategy_suggestions: [],
			inactive_follows: [],
		};
	} catch (err) {
		console.error('Error loading profile:', err);
		throw error(500, 'Failed to load profile');
	}
}) satisfies PageServerLoad;

export const actions = {
	check_inactive: async ({ fetch, request, params }) => {
		const form_data = await request.formData();
		const days = Number(form_data.get('days'));
		const { handle } = params;

		console.log('Form submission - days:', days);

		if (!days || isNaN(days)) {
			return {
				success: false,
				error: 'Valid number of days is required',
			} satisfies ActionError;
		}

		try {
			const response = await fetch(
				`/api/user/inactive?handle=${encodeURIComponent(
					handle,
				)}&days=${days}`,
			);

			if (!response.ok) {
				// Try to parse error response
				try {
					const error_data = await response.json();
					return {
						success: false,
						error:
							error_data.error || 'Failed to fetch inactive follows',
					} satisfies ActionError;
				} catch {
					return {
						success: false,
						error: 'Failed to fetch inactive follows',
					} satisfies ActionError;
				}
			}

			const data = await response.json();
			console.log('Received inactive follows:', data);

			return {
				success: true,
				inactive_follows: data.inactive_follows,
			} satisfies ActionSuccess;
		} catch (err) {
			console.error('Error:', err);
			return {
				success: false,
				error: 'Failed to fetch inactive follows',
			} satisfies ActionError;
		}
	},
} satisfies Actions;
