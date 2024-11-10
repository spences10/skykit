import type {
	ContentPatterns as ContentData,
	EngagementMetrics as EngagementData,
	NetworkAnalytics as NetworkData,
	BskyProfile as Profile,
	TemporalPatterns as TemporalData,
} from './bsky/types';

export type { Profile };

export type UserData = {
	profile: Profile | null;
	engagement: EngagementData | null;
	content: ContentData | null;
	temporal: TemporalData | null;
	network: NetworkData | null;
	account_classification: string[] | null;
	behavioural_insights: string[] | null;
	content_strategy_suggestions: string[] | null;
};

function create_user_data() {
	let data = $state<UserData>({
		profile: null,
		engagement: null,
		content: null,
		temporal: null,
		network: null,
		account_classification: null,
		behavioural_insights: null,
		content_strategy_suggestions: null,
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
