import * as analysers from './analysers';
import {
	classify_account,
	generate_behavioural_insights,
	generate_content_strategy_suggestions,
} from './insights/classification';
import type { BskyPost, BskyProfile } from './types';

export function generate_insights(
	posts: BskyPost[],
	profile: BskyProfile,
) {
	const engagement = analysers.analyse_engagement(posts, profile);
	const content = analysers.analyse_content(posts);
	const temporal = analysers.analyse_temporal_patterns(posts);
	const network = analysers.analyse_network(posts);

	return {
		engagement,
		content,
		temporal,
		network,
		account_classification: classify_account({
			engagement,
			content,
			temporal,
			network,
			profile,
		}),
		behavioural_insights: generate_behavioural_insights({
			engagement,
			content,
			temporal,
			network,
		}),
		content_strategy_suggestions:
			generate_content_strategy_suggestions({
				engagement,
				content,
				temporal,
				network,
			}),
	};
}
