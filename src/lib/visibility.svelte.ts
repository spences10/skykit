import { browser } from '$app/environment';

export type VisibilityState = {
	sections: string[];
};

export function create_visibility_state() {
	let sections = $state<string[]>([
		'engagement',
		'content',
		'temporal',
		'network',
		'insights',
	]);

	const update_sections = (
		handle: string,
		new_sections: string[],
	) => {
		if (browser) {
			localStorage.setItem(
				`visible_sections_${handle}`,
				JSON.stringify(new_sections),
			);
		}
		sections = new_sections;
	};

	const load_sections = (handle: string) => {
		if (browser) {
			const stored_sections = localStorage.getItem(
				`visible_sections_${handle}`,
			);
			if (stored_sections) {
				sections = JSON.parse(stored_sections);
			}
		}
	};

	return {
		get sections() {
			return sections;
		},
		update_sections,
		load_sections,
	};
}

export const visibility_state = create_visibility_state();
