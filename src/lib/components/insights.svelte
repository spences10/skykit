<script lang="ts">
	import {
		BarGraph,
		Clipboard,
		InformationCircle,
		LightBulb,
	} from '$lib/icons';
	import { user_store } from '$lib/user-data.svelte';
</script>

{#if user_store.data.account_classification}
	<article class="card mb-11 bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title mb-4">
				Account Insights
				<div
					class="tooltip"
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
						class="tooltip"
						data-tip="Categories that best describe your posting style"
					>
						<InformationCircle
							class_names="h-4 w-4 text-base-content/60"
						/>
					</div>
				</header>
				<ul class="flex flex-wrap gap-2" role="list">
					{#each user_store.data.account_classification as classification}
						<li class="badge badge-primary badge-lg">
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
								class="tooltip"
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
								class="tooltip"
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
