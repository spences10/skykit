<script lang="ts">
	import {
		ContentAnalysis,
		EngagementStats,
		Insights,
		NetworkAnalysis,
		ProfileCard,
		TemporalAnalysis,
	} from '$lib/components';
	import {
		InformationCircle,
		Queue,
		Spark,
		Warning,
	} from '$lib/icons';
	import { user_store } from '$lib/user-data.svelte';
	import { format_date } from '$lib/utils.js';

	let { data } = $props();
	let { profile, rate_limit } = data;

	$effect(() => {
		user_store.update_data(data);
	});
</script>

<div class="container mx-auto max-w-4xl p-4">
	<div class="mb-4">
		<a href="/" class="btn btn-ghost"> ← Back to Search </a>
	</div>

	<ProfileCard />
	<EngagementStats />
	<ContentAnalysis />
	<TemporalAnalysis />
	<NetworkAnalysis />
	<Insights />

	<!-- API Status -->
	<div class="card mb-4 bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title mb-4">
				<span>API Status</span>
				{#if rate_limit.is_limited}
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
				<!-- Request Stats -->
				<div class="stats shadow">
					<div class="stat">
						<div class="stat-figure text-primary">
							<Spark />
						</div>
						<div class="stat-title">Remaining Requests</div>
						<div class="stat-value text-primary">
							{rate_limit.remaining_requests}
						</div>
						<div class="stat-desc">of 3000 per hour</div>
					</div>
				</div>

				<!-- Queue Status -->
				<div class="stats shadow">
					<div class="stat">
						<div class="stat-figure text-secondary">
							<Queue />
						</div>
						<div class="stat-title">Queue Length</div>
						<div class="stat-value text-secondary">
							{rate_limit.queue_length}
						</div>
						<div class="stat-desc">requests waiting</div>
					</div>
				</div>
			</div>

			<!-- Rate Limit Info -->
			{#if rate_limit.is_limited}
				<div class="alert alert-warning mt-4">
					<Warning class_names="h-6 w-6 shrink-0 stroke-current" />
					<div>
						<h3 class="font-bold">Rate Limit Reached</h3>
						<div class="text-sm">
							Reset at {format_date(
								rate_limit.reset_time?.toString() ??
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
								rate_limit.reset_time?.toString() ??
									new Date().toISOString(),
							)}
						</div>
					</div>
				</div>
			{/if}

			<!-- Cache Status -->
			<div class="mt-4">
				<div class="flex items-center gap-2">
					<h3 class="font-semibold">Cache Status</h3>
					<div class="badge badge-neutral">15 min TTL</div>
				</div>
				<p class="mt-2 text-sm text-base-content/70">
					Data is cached for 15 minutes to reduce API load. Last
					fetched: {format_date(profile.indexedAt)}
				</p>
			</div>
		</div>
	</div>
</div>
