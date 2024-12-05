<script lang="ts">
	import { InformationCircle } from '$lib/icons';
	import { user_store } from '$lib/user-data.svelte';
</script>

<h2 class="card-title mb-4">
	Content Analysis
	<div
		class="tooltip cursor-pointer"
		data-tip="Breakdown of your posting habits and content patterns"
	>
		<InformationCircle class_names="h-5 w-5 text-base-content/60" />
	</div>
	{#if user_store.data.temporal?.posting_frequency.date_range}
		<div
			class="tooltip tooltip-right cursor-pointer"
			data-tip={`Analysis from ${new Date(user_store.data.temporal.posting_frequency.date_range.from).toLocaleDateString()} to ${new Date(user_store.data.temporal.posting_frequency.date_range.to).toLocaleDateString()}`}
		>
			<span class="badge badge-sm">
				{user_store.data.temporal.posting_frequency.date_range
					.total_days} days
			</span>
		</div>
	{/if}
</h2>
