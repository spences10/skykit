<script lang="ts">
	import { InactiveFollows } from '$lib/components';
	import { inactive_state } from '$lib/inactive.svelte';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	let loading = $derived(inactive_state.loading);
	let inactive_follows = $derived(
		inactive_state.filtered_and_sorted_follows,
	);
	let error = $derived(inactive_state.error);
	let days_threshold = $derived(inactive_state.days_threshold);
	let sort_direction = $derived(inactive_state.sort_direction);

	const handle_form_submit = async () => {
		await inactive_state.fetch_inactive_follows(
			data.profile.handle,
			days_threshold,
		);
	};

	const open_all_profiles = () => {
		const tabs = inactive_follows.length;
		const MAX_TABS = 25;

		if (tabs > MAX_TABS) {
			const message = `Opening too many tabs (${tabs}) may cause performance issues. Only the first ${MAX_TABS} tabs will be opened. Continue?`;
			if (!window.confirm(message)) return;

			inactive_follows.slice(0, MAX_TABS).forEach((follow) => {
				window.open(
					`https://bsky.app/profile/${follow.handle}`,
					'_blank',
				);
			});
		} else {
			const message = `This will open ${tabs} new tabs. Are you sure you want to continue?`;
			if (window.confirm(message)) {
				inactive_follows.forEach((follow) => {
					window.open(
						`https://bsky.app/profile/${follow.handle}`,
						'_blank',
					);
				});
			}
		}
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
	<nav class="mb-4" aria-label="Back navigation">
		<a
			href="/{data.profile.handle}"
			class="btn btn-ghost"
			aria-label="Back to profile"
		>
			← Back to Profile
		</a>
	</nav>

	<header class="mb-6">
		<h1 class="text-2xl font-bold">
			Inactive Follows for @{data.profile.handle}
		</h1>
	</header>

	<section
		class="card mb-6 bg-base-100 shadow-xl"
		aria-label="Inactive follows controls"
	>
		<div class="card-body">
			<!-- Search Form -->
			<form
				method="POST"
				action="?/check_inactive"
				onsubmit={(e) => {
					e.preventDefault();
					handle_form_submit();
				}}
				aria-label="Inactive follows search form"
				class="flex flex-col gap-4 sm:flex-row"
			>
				<div class="form-control">
					<label class="label" for="days">
						<span class="label-text font-medium">
							Inactivity Threshold
						</span>
					</label>
					<div class="join w-full sm:w-auto">
						<input
							type="number"
							name="days"
							id="days"
							bind:value={inactive_state.days_threshold}
							min="1"
							max="365"
							class="input join-item input-bordered w-full sm:w-24"
							aria-label="Days threshold"
						/>
						<span class="btn join-item btn-neutral no-animation">
							days
						</span>
					</div>
				</div>
				<button
					type="submit"
					class="btn btn-primary w-full self-end sm:ml-auto sm:w-auto"
					disabled={loading}
					aria-busy={loading}
				>
					{#if loading}
						<span class="loading loading-spinner" aria-hidden="true"
						></span>
					{/if}
					Check Inactive Follows
				</button>
			</form>

			{#if inactive_follows.length > 0}
				<div class="divider"></div>

				<!-- Controls Section -->
				<div
					class="stats stats-vertical w-full bg-base-200 shadow-sm sm:stats-horizontal"
				>
					<!-- Sort Controls -->
					<div class="stat">
						<div class="stat-title">Sort by Last Post</div>
						<div class="stat-actions mt-2">
							<div class="join w-full border border-primary">
								<button
									class="btn join-item flex-1 {sort_direction ===
									'desc'
										? 'btn-primary'
										: 'btn-ghost'}"
									onclick={() =>
										(inactive_state.sort_direction = 'desc')}
									aria-pressed={sort_direction === 'desc'}
								>
									Newest First
								</button>
								<button
									class="btn join-item flex-1 {sort_direction ===
									'asc'
										? 'btn-primary'
										: 'btn-ghost'}"
									onclick={() =>
										(inactive_state.sort_direction = 'asc')}
									aria-pressed={sort_direction === 'asc'}
								>
									Oldest First
								</button>
							</div>
						</div>
					</div>

					<!-- Filter Controls -->
					<div class="stat">
						<div class="stat-title">Filter Options</div>
						<div class="stat-actions mt-2">
							<div class="flex flex-col gap-2">
								<label
									class="label cursor-pointer justify-start gap-4"
								>
									<input
										type="checkbox"
										class="checkbox-primary checkbox"
										bind:checked={inactive_state.show_never_posted}
										aria-label="Show only users who never posted"
									/>
									<span class="label-text">Never Posted Only</span>
								</label>
								<label
									class="label cursor-pointer justify-start gap-4"
								>
									<input
										type="checkbox"
										class="checkbox-primary checkbox"
										bind:checked={inactive_state.hide_follows_back}
										aria-label="Hide users who follow you back"
									/>
									<span class="label-text">Hide Follows Back</span>
								</label>
							</div>
						</div>
					</div>
				</div>

				<!-- Statistics and Actions -->
				<div class="mt-4">
					<div
						class="stats stats-vertical w-full bg-base-200 shadow-sm sm:stats-horizontal"
					>
						<div class="stat">
							<div class="stat-title">Inactive Follows Found</div>
							<div class="stat-value text-primary">
								{inactive_follows.length}
							</div>
							<div class="stat-desc">
								{days_threshold} days or more of inactivity
							</div>
						</div>
						<div class="stat">
							<div class="stat-actions">
								<button
									class="btn btn-primary"
									onclick={open_all_profiles}
									aria-label={`Open all ${inactive_follows.length} profiles in new tabs`}
								>
									Open All Profiles ({inactive_follows.length})
								</button>
								<div class="stat-desc mt-2">
									<span class="font-black">Note:</span> This will open
									a new tab for each profile.
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>
	</section>

	{#if error}
		<div class="alert alert-error mb-4" role="alert">
			<p>{error}</p>
		</div>
	{/if}

	<InactiveFollows />
</main>
