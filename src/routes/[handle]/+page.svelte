<script lang="ts">
	import {
		ContentAnalysis,
		EngagementStats,
		Insights,
		NetworkAnalysis,
		ProfileCard,
		TemporalAnalysis,
	} from '$lib/components';
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
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M13 10V3L4 14h7v7l9-11h-7z"
								/>
							</svg>
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
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-6 w-6"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
								/>
							</svg>
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
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6 shrink-0 stroke-current"
						fill="none"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
						/>
					</svg>
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
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-6 w-6 shrink-0 stroke-current"
						fill="none"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						/>
					</svg>
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
