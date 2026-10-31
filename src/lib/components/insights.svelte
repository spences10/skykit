<script lang="ts">
	import { user_store } from '#lib/user-data.svelte.js';
	import ChartColumn from '@lucide/svelte/icons/chart-column';
	import Clipboard from '@lucide/svelte/icons/clipboard';
	import Info from '@lucide/svelte/icons/info';
	import Lightbulb from '@lucide/svelte/icons/lightbulb';

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
			<h2 class="mb-4 card-title">
				Account Insights
				<div
					class="tooltip cursor-pointer"
					data-tip="Best guess analysis of your account behavior and suggestions"
				>
					<Info class="h-5 w-5 text-base-content/60" />
				</div>
			</h2>

			<!-- Account Classification -->
			<section class="mb-6">
				<header
					class="mb-2 card-title flex items-center gap-2 text-sm"
				>
					<Clipboard class="h-5 w-5" />
					Account Type
					<div
						class="tooltip tooltip-left cursor-pointer"
						data-tip="Based on your posting frequency, engagement patterns, and content style. These categories are determined by analysing your last 300 posts."
					>
						<Info class="h-4 w-4 text-base-content/60" />
					</div>
				</header>
				<ul class="flex flex-wrap gap-2" role="list">
					{#each user_store.data.account_classification as classification}
						<li
							class="tooltip badge cursor-pointer badge-lg badge-primary"
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
							<ChartColumn class="h-5 w-5" />
							Behavioural Insights
							<div
								class="tooltip cursor-pointer"
								data-tip="Observations about your posting and interaction patterns"
							>
								<Info class="h-4 w-4 text-base-content/60" />
							</div>
						</header>
						{#if user_store.data.behavioural_insights}
							<ul class="space-y-2" role="list">
								{#each user_store.data.behavioural_insights as insight}
									<li class="alert py-2 alert-info">
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
							<Lightbulb class="h-5 w-5" />
							Strategy Suggestions
							<div
								class="tooltip cursor-pointer"
								data-tip="Guessed recommendation to improve your engagement"
							>
								<Info class="h-4 w-4 text-base-content/60" />
							</div>
						</header>
						{#if user_store.data.content_strategy_suggestions}
							<ul class="space-y-2" role="list">
								{#each user_store.data.content_strategy_suggestions as suggestion}
									<li class="alert py-2 alert-success">
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
