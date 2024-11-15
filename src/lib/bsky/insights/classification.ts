import type {
	BskyProfile,
	ContentPatterns,
	EngagementMetrics,
	NetworkAnalytics,
	TemporalPatterns,
} from '$lib/types';

export function classify_account(data: {
	engagement: EngagementMetrics;
	content: ContentPatterns;
	temporal: TemporalPatterns;
	network: NetworkAnalytics;
	profile: BskyProfile;
}) {
	const classifications = [];

	// Engagement-based classification
	if (data.engagement.engagement_rate > 30) {
		classifications.push('Conversation Starter');
	}
	if (data.engagement.trending_score > 10) {
		classifications.push('Viral Creator');
	}

	// Content-based classification
	const total_posts =
		data.content.post_types.text_only +
		data.content.post_types.with_media +
		data.content.post_types.with_links;

	if (
		total_posts > 0 &&
		data.content.post_types.text_only > total_posts * 0.7
	) {
		classifications.push('Original Content Creator');
	}
	if (data.content.post_types.replies > total_posts * 0.5) {
		classifications.push('Community Engager');
	}

	// Network-based classification
	const followerCount = data.profile.followersCount || 0;
	const followingCount = data.profile.followsCount || 0;
	if (followingCount > 0 && followerCount > followingCount * 2) {
		classifications.push('Influential');
	}

	// Default classification
	if (classifications.length === 0) {
		classifications.push('Regular Participant');
	}

	return classifications;
}

export function generate_behavioural_insights(data: {
	engagement: EngagementMetrics;
	content: ContentPatterns;
	temporal: TemporalPatterns;
	network: NetworkAnalytics;
}) {
	const insights = [];

	// Engagement insights
	if (data.engagement.trending_score > 5) {
		insights.push(
			`Creates trending content with a score of ${data.engagement.trending_score.toFixed(1)}`,
		);
	}

	// Content insights
	if (data.content.post_types.with_media > 40) {
		insights.push(
			'Frequently uses media in posts to increase engagement',
		);
	}

	// Network insights
	const top_reply = data.network.reply_network.outgoing[0];
	if (top_reply) {
		insights.push(`Most frequently interacts with @${top_reply[0]}`);
	}

	return insights;
}

export function generate_content_strategy_suggestions(data: {
	engagement: EngagementMetrics;
	content: ContentPatterns;
	temporal: TemporalPatterns;
	network: NetworkAnalytics;
}) {
	const suggestions = [];

	// Engagement-based suggestions
	if (data.engagement.engagement_rate < 5) {
		suggestions.push(
			'Consider increasing interaction with other users to boost engagement',
		);
	}

	// Content-based suggestions
	if (data.content.post_types.with_media < 20) {
		suggestions.push(
			'Try incorporating more media content to potentially increase engagement',
		);
	}

	// Temporal suggestions
	if (data.temporal.posting_frequency.active_days_percentage < 50) {
		suggestions.push(
			'More consistent posting schedule could help build a stronger following',
		);
	}

	return suggestions;
}
