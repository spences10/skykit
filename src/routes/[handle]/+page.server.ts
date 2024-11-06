import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, params }) => {
	const { handle } = params;

	try {
		const response = await fetch(
			`/api/user?handle=${encodeURIComponent(handle)}`,
		);

		if (!response.ok) {
			throw error(response.status, await response.text());
		}

		const profile = await response.json();

		return { profile };
	} catch (err) {
		console.error('Failed to fetch profile:', err);
		throw error(500, 'Failed to fetch profile data');
	}
};
