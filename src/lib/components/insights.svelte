<script lang="ts">
	import {
		BarGraph,
		Clipboard,
		InformationCircle,
		LightBulb,
	} from '$lib/icons';
	import { user_store } from '$lib/user-data.svelte';

	const get_classification_description = (classification: string) => {
		const descriptions: Record<string, string> = {
			'Conversation Starter':
				'High ratio of posts that generate multiple replies and extended discussions',
			'Content Creator':
				'Regularly posts original content with high media usage',
			'Community Engager':
				'Frequently interacts with others through replies and mentions',
			'Consistent Poster':
				'Posts regularly with a steady daily or weekly pattern',
			'Casual User':
				'Posts occasionally with varied engagement patterns',
			'Network Builder':
				'Strong focus on building connections through mentions and replies',
			'Visual Sharer':
				'High percentage of posts containing images or media',
			'Discussion Participant':
				'Actively engages in existing conversations through replies',
			'Thought Leader':
				'Posts generate above-average engagement and spark discussions',
			'Content Curator':
				'Frequently shares and reposts content from others',
		};

		return (
			descriptions[classification] ||
			'Classification based on posting patterns and engagement'
		);
	};
</script>

{#if user_store.data.account_classification}
	<article class="card mb-11 bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title mb-4">
				Account Insights
				<div
					class="tooltip cursor-pointer"
					data-tip="Best guess analysis of your account behavior and suggestions"
				>
					<InformationCircle
						class_names="h-5 w-5 text-base-content/60"
					/>
				</div>
			</h2>

			<!-- Account Classification -->
			<section class="mb-6">
				<header
					class="card-title mb-2 flex items-center gap-2 text-sm"
				>
					<Clipboard class_names="h-5 w-5" />
					Account Type
					<div
						class="tooltip tooltip-left cursor-pointer"
						data-tip="Based on your posting frequency, engagement patterns, and content style. These categories are determined by analysing your last 300 posts."
					>
						<InformationCircle
							class_names="h-4 w-4 text-base-content/60"
						/>
					</div>
				</header>
				<ul class="flex flex-wrap gap-2" role="list">
					{#each user_store.data.account_classification as classification}
						<li
							class="badge badge-primary badge-lg tooltip cursor-pointer"
							data-tip={get_classification_description(
								classification,
							)}
						>
							{classification}
						</li>
					{/each}
				</ul>
			</section>

			<div class="grid gap-4 md:grid-cols-2">
				<!-- Behavioural Insights -->
				<section class="card bg-base-200">
					<div class="card-body">
						<header
							class="card-title flex items-center gap-2 text-sm"
						>
							<BarGraph class_names="h-5 w-5" />
							Behavioural Insights
							<div
								class="tooltip cursor-pointer"
								data-tip="Observations about your posting and interaction patterns"
							>
								<InformationCircle
									class_names="h-4 w-4 text-base-content/60"
								/>
							</div>
						</header>
						{#if user_store.data.behavioural_insights}
							<ul class="space-y-2" role="list">
								{#each user_store.data.behavioural_insights as insight}
									<li class="alert alert-info py-2">
										{insight}
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				</section>

				<!-- Content Strategy -->
				<section class="card bg-base-200">
					<div class="card-body">
						<header
							class="card-title flex items-center gap-2 text-sm"
						>
							<LightBulb class_names="h-5 w-5" />
							Strategy Suggestions
							<div
								class="tooltip cursor-pointer"
								data-tip="Guessed recommendation to improve your engagement"
							>
								<InformationCircle
									class_names="h-4 w-4 text-base-content/60"
								/>
							</div>
						</header>
						{#if user_store.data.content_strategy_suggestions}
							<ul class="space-y-2" role="list">
								{#each user_store.data.content_strategy_suggestions as suggestion}
									<li class="alert alert-success py-2">
										{suggestion}
									</li>
								{/each}
							</ul>
						{/if}
					</div>
				</section>
			</div>
		</div>
	</article>
{/if}
