<script lang="ts">
	import {
		BarGraph,
		Clipboard,
		InformationCircle,
		LightBulb,
		Spark,
	} from '$lib/icons';
	import { user_store } from '$lib/user-data.svelte';
</script>

{#if user_store.data.account_classification}
	<div class="card mb-4 bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title mb-4">Account Insights</h2>

			<!-- Account Classification -->
			<div class="mb-6">
				<h3 class="card-title mb-2 text-sm">
					<Clipboard class_names="h-5 w-5" />
					Account Type
				</h3>
				<div class="flex flex-wrap gap-2">
					{#each user_store.data.account_classification as classification}
						<div class="badge badge-primary badge-lg">
							{classification}
						</div>
					{/each}
				</div>
			</div>

			<div class="grid gap-4 md:grid-cols-2">
				<!-- Behavioural Insights -->
				<div class="card bg-base-200">
					<div class="card-body">
						<h3 class="card-title text-sm">
							<BarGraph class_names="h-5 w-5" />
							Behavioural Insights
						</h3>
						<div class="space-y-2">
							{#each user_store.data.behavioural_insights as insight}
								<div class="alert alert-info py-2">
									<InformationCircle class_names="h-5 w-5" />
									<span class="text-sm">{insight}</span>
								</div>
							{/each}
						</div>
					</div>
				</div>

				<!-- Content Strategy -->
				<div class="card bg-base-200">
					<div class="card-body">
						<h3 class="card-title text-sm">
							<LightBulb class_names="h-5 w-5" />
							Strategy Suggestions
						</h3>
						<div class="space-y-2">
							{#each user_store.data.content_strategy_suggestions as suggestion}
								<div class="alert alert-success py-2">
									<Spark class_names="h-5 w-5 shrink-0" />
									<span class="text-sm">{suggestion}</span>
								</div>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
