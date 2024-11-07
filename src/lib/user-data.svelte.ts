export type Profile = {
	avatar?: string;
	displayName: string;
	handle: string;
	did: string;
	followersCount: number;
	followsCount: number;
	postsCount: number;
	description?: string;
	indexedAt: string;
};

export type UserData = {
	profile: Profile | null;
	rate_limit: any;
	engagement: any;
	content: any;
	temporal: any;
	network: any;
	account_classification: any;
	behavioural_insights: any;
	content_strategy_suggestions: any;
};

// Create a function that returns the reactive state
export function create_user_data() {
	let data = $state<UserData>({
		profile: null,
		rate_limit: null,
		engagement: null,
		content: null,
		temporal: null,
		network: null,
		account_classification: null,
		behavioural_insights: null,
		content_strategy_suggestions: null,
	});

	// Function to update the state
	function update_data(new_data: Partial<UserData>) {
		for (const [key, value] of Object.entries(new_data)) {
			data[key as keyof UserData] = value;
		}
	}

	// Return both the reactive state and methods to interact with it
	return {
		get data() {
			return data;
		},
		update_data,
	};
}

// Export a singleton instance
export const user_store = create_user_data();
