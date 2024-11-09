<script lang="ts">
	import { api_status } from '$lib/api-status.svelte';
	import {
		InformationCircle,
		Queue,
		Spark,
		Warning,
	} from '$lib/icons';
	import { format_date } from '$lib/utils';

	const { status } = api_status;
</script>

<div class="card bg-base-100 shadow-xl">
	<div class="card-body">
		<h2 class="card-title mb-4">
			<span>API Status</span>
			{#if status.is_limited}
				<div class="badge badge-warning gap-2">
					<span class="loading loading-spinner loading-xs"></span>
					Rate Limited
				</div>
			{:else}
				<div class="badge badge-success gap-2">
					<span class="loading loading-ring loading-xs"></span>
					Healthy
				</div>
			{/if}
		</h2>

		<div class="grid gap-4 md:grid-cols-2">
			<div class="stats shadow">
				<div class="stat">
					<div class="stat-figure text-primary">
						<Spark />
					</div>
					<div class="stat-title">Remaining Requests</div>
					<div class="stat-value text-primary">
						{status.remaining_requests}
					</div>
					<div class="stat-desc">of 3000 per hour</div>
				</div>
			</div>

			<div class="stats shadow">
				<div class="stat">
					<div class="stat-figure text-secondary">
						<Queue />
					</div>
					<div class="stat-title">Queue Length</div>
					<div class="stat-value text-secondary">
						{status.queue_length}
					</div>
					<div class="stat-desc">requests waiting</div>
				</div>
			</div>
		</div>

		{#if status.is_limited}
			<div class="alert alert-warning mt-4">
				<Warning class_names="h-6 w-6 shrink-0 stroke-current" />
				<div>
					<h3 class="font-bold">Rate Limit Reached</h3>
					<div class="text-sm">
						Reset at {format_date(
							status.reset_time?.toString() ??
								new Date().toISOString(),
						)}
					</div>
				</div>
			</div>
		{:else}
			<div class="alert alert-info mt-4">
				<InformationCircle />
				<div>
					<h3 class="font-bold">API is responding normally</h3>
					<div class="text-sm">
						Next reset: {format_date(
							status.reset_time?.toString() ??
								new Date().toISOString(),
						)}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
