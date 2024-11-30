<script lang="ts">
	import { InformationCircle } from '$lib/icons';
	import { user_store } from '$lib/user-data.svelte';
</script>

{#if user_store.data.temporal}
	<div class="grid gap-4 md:grid-cols-2">
		<!-- Peak Hours -->
		<section class="card bg-base-200">
			<div class="card-body">
				<h3 class="card-title flex items-center gap-2 text-sm">
					Most Active Hours
					<div
						class="tooltip cursor-pointer"
						data-tip="Times of day when you post most frequently"
					>
						<InformationCircle
							class_names="h-4 w-4 text-base-content/60"
						/>
					</div>
				</h3>
				<dl class="space-y-2">
					{#each user_store.data.temporal.posting_frequency.most_active_hours.slice(0, 3) as [hour, count]}
						<div class="flex items-center justify-between">
							<dt>{hour}</dt>
							<dd class="badge badge-primary">
								{count} posts
							</dd>
						</div>
					{/each}
				</dl>
			</div>
		</section>

		<!-- Active Days -->
		<section class="card bg-base-200">
			<div class="card-body">
				<h3 class="card-title flex items-center gap-2 text-sm">
					Most Active Days
					<div
						class="tooltip cursor-pointer"
						data-tip="Days of the week when you're most active"
					>
						<InformationCircle
							class_names="h-4 w-4 text-base-content/60"
						/>
					</div>
				</h3>
				<dl class="space-y-2">
					{#each user_store.data.temporal.posting_frequency.most_active_days.slice(0, 3) as [day, count]}
						<div class="flex items-center justify-between">
							<dt>{day}</dt>
							<dd class="badge badge-secondary">
								{count} posts
							</dd>
						</div>
					{/each}
				</dl>
			</div>
		</section>
	</div>
{/if}
