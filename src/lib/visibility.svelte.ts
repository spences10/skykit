import { browser } from '$app/environment';

export type VisibilityState = {
	sections: string[];
};

export function create_visibility_state() {
	let sections = $state<string[]>([]);

	const update_sections = (
		handle: string,
		new_sections: string[],
	) => {
		sections = new_sections;
		if (browser) {
			localStorage.setItem(
				`visible_sections_${handle}`,
				JSON.stringify(new_sections),
			);
		}
	};

	const load_sections = (handle: string) => {
		if (browser) {
			const stored_sections = localStorage.getItem(
				`visible_sections_${handle}`,
			);
			sections = stored_sections
				? JSON.parse(stored_sections)
				: [
						'engagement',
						'content',
						'temporal',
						'network',
						'insights',
					];
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
