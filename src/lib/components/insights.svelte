<script lang="ts">
	import { BarGraph, Clipboard, LightBulb } from '$lib/icons';
	import { user_store } from '$lib/user-data.svelte';
</script>

{#if user_store.data.account_classification}
	<article class="card mb-11 bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title mb-4">Account Insights</h2>

			<!-- Account Classification -->
			<section class="mb-6">
				<header class="card-title mb-2 text-sm">
					<Clipboard class_names="h-5 w-5" />
					Account Type
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
						<header class="card-title text-sm">
							<BarGraph class_names="h-5 w-5" />
							Behavioural Insights
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
						<header class="card-title text-sm">
							<LightBulb class_names="h-5 w-5" />
							Strategy Suggestions
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
