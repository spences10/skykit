import type {
	BskyProfile,
	ContentPatterns,
	EngagementMetrics,
	NetworkAnalytics,
	TemporalPatterns,
} from '$lib/types';

export type { BskyProfile };

// Make all properties either the type or undefined, except profile which can be null
export type UserData = {
	profile: BskyProfile | null;
	engagement?: EngagementMetrics;
	content?: ContentPatterns;
	temporal?: TemporalPatterns;
	network?: NetworkAnalytics;
	account_classification?: string[];
	behavioural_insights?: string[];
	content_strategy_suggestions?: string[];
};

function create_user_data() {
	let data = $state<UserData>({
		profile: null,
		engagement: undefined,
		content: undefined,
		temporal: undefined,
		network: undefined,
		account_classification: undefined,
		behavioural_insights: undefined,
		content_strategy_suggestions: undefined,
	});

	const update_data = (new_data: UserData) => {
		// Only update if data has actually changed
		if (JSON.stringify(data) !== JSON.stringify(new_data)) {
			data = new_data;
		}
	};

	return {
		get data() {
			return data;
		},
		update_data,
	};
}

export const user_store = create_user_data();
