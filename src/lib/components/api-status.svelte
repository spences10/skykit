<script lang="ts">
	import { api_status } from '$lib/api-status.svelte';
	import {
		Bell,
		CircleCheck,
		InformationCircle,
		Warning,
	} from '$lib/icons';
	import { format_date } from '$lib/utils';

	const get_health_indicator = (status: boolean) => {
		if (status) {
			return {
				class: 'alert-success',
				icon: CircleCheck,
				message: 'API is responding normally',
			};
		}
		return {
			class: 'alert-warning',
			icon: Warning,
			message: 'Rate limit reached, please wait',
		};
	};
</script>

<div class="card mb-11 bg-base-100 p-4 shadow-xl">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-2">
			<h2 class="text-lg font-semibold">API Status</h2>
			<div
				class="tooltip"
				data-tip="Bluesky API allows 300 requests per 5 minutes"
			>
				<InformationCircle
					class_names="h-4 w-4 text-base-content/60"
				/>
			</div>
		</div>

		<!-- Health Status -->
		<div
			class="tooltip"
			data-tip={api_status.status.is_healthy
				? 'API Available'
				: 'Rate Limited'}
		>
			<div
				class="badge badge-lg {api_status.status.is_healthy
					? 'badge-success'
					: 'badge-warning'}"
			>
				{api_status.status.is_healthy ? 'Available' : 'Rate Limited'}
			</div>
		</div>
	</div>

	<div class="mt-4 grid gap-4">
		<!-- Rate Limits -->
		<div class="stats stats-vertical shadow lg:stats-horizontal">
			<div class="stat">
				<div class="stat-figure text-primary">
					<Bell class_names="h-6 w-6" />
				</div>
				<div class="stat-title">API Requests</div>
				<div class="stat-value text-primary">
					{api_status.status.remaining_requests}
				</div>
				<div class="stat-desc">
					of {api_status.status.max_requests} per 5 minutes
				</div>
			</div>

			{#if api_status.status.retry_after}
				<div class="stat">
					<div class="stat-figure text-accent">
						<Bell class_names="h-6 w-6" />
					</div>
					<div class="stat-title">Retry After</div>
					<div class="stat-value text-accent">
						{api_status.status.retry_after}s
					</div>
					<div class="stat-desc">Until next request allowed</div>
				</div>
			{/if}
		</div>

		<!-- Reset Time -->
		{#if api_status.status.reset_time}
			<div
				class="alert text-sm {api_status.status.is_healthy
					? 'alert-info'
					: 'alert-warning'}"
			>
				<svelte:component
					this={get_health_indicator(api_status.status.is_healthy)
						.icon}
					class_names="h-5 w-5"
				/>
				<div>
					<h3 class="font-bold">
						{get_health_indicator(api_status.status.is_healthy)
							.message}
					</h3>
					<div class="text-xs">
						Rate limits reset at {format_date(
							api_status.status.reset_time.toString(),
						)}
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
