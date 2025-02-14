<script lang="ts">
	import { inactive_state } from '$lib/inactive.svelte';

	let cache_stats = $derived(inactive_state.cache_stats);

	const number_format = new Intl.NumberFormat(undefined, {
		maximumFractionDigits: 0,
	});
</script>

<div class="card bg-base-200 shadow-lg">
	<div class="card-body p-4 sm:p-6">
		<div
			class="sm:stats sm:bg-base-100 grid w-full grid-cols-1 gap-4 sm:shadow"
		>
			<div class="stat bg-base-100 shadow sm:shadow-none">
				<div class="stat-title">Cache Performance</div>
				<div class="stat-value text-2xl">
					{cache_stats?.hit_rate || 0}% from cache
				</div>
				<div class="stat-desc mt-3">
					<div class="flex flex-wrap justify-center gap-2">
						<div class="badge badge-success badge-lg gap-2">
							<span class="font-medium">
								{number_format.format(cache_stats?.cache_hits || 0)}
							</span>
							<span class="opacity-80">from database</span>
						</div>
						<div class="badge badge-warning badge-lg gap-2">
							<span class="font-medium">
								{number_format.format(cache_stats?.cache_misses || 0)}
							</span>
							<span class="opacity-80">from API</span>
						</div>
					</div>
					<div class="text-base-content/70 mt-2">
						Total Processed: {number_format.format(
							cache_stats?.total_processed || 0,
						)}
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
