// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface PageData {
			profile: import('$lib/bsky/types').BskyProfile;
			engagement: import('$lib/bsky/types').EngagementMetrics;
			content: import('$lib/bsky/types').ContentPatterns;
			temporal: import('$lib/bsky/types').TemporalPatterns;
			network: import('$lib/bsky/types').NetworkAnalytics;
			account_classification: string[];
			behavioural_insights: string[];
			content_strategy_suggestions: string[];
		}
	}
}

export {};
