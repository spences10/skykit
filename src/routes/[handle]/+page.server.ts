import { error } from '@sveltejs/kit';

export const load = async ({ fetch, params }) => {
	const { handle } = params;

	try {
		const response = await fetch(
			`/api/user?handle=${encodeURIComponent(handle)}`,
		);

		if (!response.ok) {
			throw error(response.status, await response.text());
		}

		return await response.json();
	} catch (err) {
		console.error('Failed to fetch data:', err);
		throw error(500, 'Failed to fetch profile data');
	}
};
