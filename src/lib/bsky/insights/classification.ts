import type { BskyProfile } from '../types';

export function classify_account(data: {
	engagement: any;
	content: any;
	temporal: any;
	network: any;
	profile: BskyProfile;
}) {
	const classifications = [];

	// Engagement-based classification
	if (data.engagement.conversation_starter_ratio > 0.3) {
		classifications.push('Conversation Starter');
	}
	if (data.engagement.viral_post_percentage > 10) {
		classifications.push('Viral Creator');
	}

	// Content-based classification
	if (data.content.post_types.original_posts > 70) {
		classifications.push('Original Content Creator');
	}
	if (data.content.post_types.replies > 50) {
		classifications.push('Community Engager');
	}

	// Network-based classification
	if (data.profile.followersCount > data.profile.followsCount * 2) {
		classifications.push('Influential');
	}

	// Default classification
	if (classifications.length === 0) {
		classifications.push('Regular Participant');
	}

	return classifications;
}

export function generate_behavioural_insights(data: {
	engagement: any;
	content: any;
	temporal: any;
	network: any;
}) {
	const insights = [];

	// Engagement insights
	if (data.engagement.viral_post_percentage > 5) {
		insights.push(
			`Creates viral content with ${data.engagement.viral_post_percentage.toFixed(1)}% of posts gaining significant traction`,
		);
	}

	// Content insights
	if (data.content.post_types.with_media > 40) {
		insights.push(
			'Frequently uses media in posts to increase engagement',
		);
	}

	// Network insights
	const topInteractions =
		data.network.interaction_network.most_replied_to[0];
	if (topInteractions) {
		insights.push(
			`Most frequently interacts with @${topInteractions[0]}`,
		);
	}

	return insights;
}

export function generate_content_strategy_suggestions(data: {
	engagement: any;
	content: any;
	temporal: any;
	network: any;
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
	if (data.temporal.consistency_score < 0.5) {
		suggestions.push(
			'More consistent posting schedule could help build a stronger following',
		);
	}

	return suggestions;
}
