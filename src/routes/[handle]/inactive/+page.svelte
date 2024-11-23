<script lang="ts">
	import { InactiveFollows } from '$lib/components';
	import { inactive_state } from '$lib/inactive.svelte';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();
	let days_threshold = $state(30);
	let sort_option = $state<'last_post' | 'handle'>('last_post');

	let loading = $derived(inactive_state.loading);
	let inactive_follows = $derived(inactive_state.inactive_follows);
	let error = $derived(inactive_state.error);

	const handle_form_submit = async () => {
		await inactive_state.fetch_inactive_follows(
			data.profile.handle,
			days_threshold,
			sort_option
		);
	};
</script>

<svelte:head>
	<title>
		Inactive Follows - {data.profile?.handle || 'Loading...'}
	</title>
	<meta
		name="description"
		content={`Check out ${data.profile?.handle || ''}'s inactive follows on Bluesky`}
	/>
</svelte:head>

<main class="container mx-auto max-w-4xl p-4">
	<nav class="mb-4">
		<a href="/{data.profile.handle}" class="btn btn-ghost">
			← Back to Profile
		</a>
	</nav>

	<h1 class="mb-6 text-2xl font-bold">
		Inactive Follows for @{data.profile.handle}
	</h1>

	<div class="card mb-6 bg-base-100 shadow-xl">
		<div class="card-body p-4 sm:p-6">
			<form
				method="POST"
				action="?/check_inactive"
				onsubmit={(e) => {
					e.preventDefault();
					handle_form_submit();
				}}
			>
				<div class="flex flex-col gap-4 sm:flex-row sm:items-end">
					<div class="form-control w-full sm:max-w-xs">
						<label class="label" for="days">
							<span class="label-text">Days of inactivity</span>
						</label>
						<input
							type="number"
							name="days"
							id="days"
							bind:value={days_threshold}
							min="1"
							max="365"
							class="input input-bordered w-full"
						/>
					</div>
					<div class="form-control w-full sm:w-auto">
						<label class="label" for="sort">
							<span class="label-text">Sort by</span>
						</label>
						<select 
							bind:value={sort_option}
							class="select select-bordered w-full"
							id="sort"
						>
							<option value="last_post">Last Post Date</option>
							<option value="handle">Handle</option>
						</select>
					</div>
					<button
						type="submit"
						class="btn btn-primary w-full sm:w-auto"
						disabled={loading}
					>
						{#if loading}
							<span class="loading loading-spinner"></span>
						{/if}
						Check Inactive Follows
					</button>
				</div>
			</form>

			{#if inactive_follows.length > 0}
				<div class="mt-4">
					<div class="stats shadow w-full">
						<div class="stat">
							<div class="stat-title">Inactive Follows Found</div>
							<div class="stat-value text-primary">
								{inactive_follows.length}
							</div>
							<div class="stat-desc">
								{days_threshold} days or more of inactivity
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</div>

	{#if error}
		<div class="alert alert-error mb-4">
			<p>{error}</p>
		</div>
	{/if}

	<InactiveFollows 
		{inactive_follows}
		{loading}
		progress={inactive_state.progress} 
	/>
</main>
