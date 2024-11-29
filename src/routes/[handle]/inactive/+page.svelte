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
		const message = `This will open ${tabs} new tabs. Are you sure you want to continue?`;

		if (window.confirm(message)) {
			inactive_follows.forEach((follow) => {
				window.open(
					`https://bsky.app/profile/${follow.handle}`,
					'_blank',
				);
			});
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
		<div class="card-body p-4 sm:p-6">
			<form
				method="POST"
				action="?/check_inactive"
				class="space-y-4"
				onsubmit={(e) => {
					e.preventDefault();
					handle_form_submit();
				}}
				aria-label="Inactive follows search form"
			>
				<div class="flex flex-wrap items-end gap-4">
					<div class="form-control w-24">
						<label class="label" for="days">
							<span class="label-text">Days</span>
						</label>
						<input
							type="number"
							name="days"
							id="days"
							bind:value={inactive_state.days_threshold}
							min="1"
							max="365"
							class="input input-bordered w-full"
							aria-label="Days threshold"
						/>
					</div>
					<button
						type="submit"
						class="btn btn-primary ml-auto"
						disabled={loading}
						aria-busy={loading}
					>
						{#if loading}
							<span class="loading loading-spinner" aria-hidden="true"
							></span>
						{/if}
						Check Inactive Follows
					</button>
				</div>
			</form>

			{#if inactive_follows.length > 0}
				<div class="divider"></div>
				<section
					class="flex items-center justify-between"
					aria-label="Statistics and controls"
				>
					<div
						class="stats shadow"
						role="region"
						aria-label="Inactive follows statistics"
					>
						<div class="stat">
							<h2 class="stat-title">Inactive Follows Found</h2>
							<div class="stat-value text-primary">
								{inactive_follows.length}
							</div>
							<div class="stat-desc">
								{days_threshold} days or more of inactivity
							</div>
						</div>
					</div>

					<!-- Sort and Filter Controls -->
					<div class="flex flex-col items-end gap-2">
						<div
							class="flex items-center gap-2"
							role="group"
							aria-label="Sort controls"
						>
							<span class="text-sm font-medium">
								Sort by Last Post:
							</span>
							<div class="join">
								<button
									class="btn join-item btn-sm {sort_direction ===
									'desc'
										? 'btn-primary'
										: 'btn-ghost'}"
									onclick={() =>
										(inactive_state.sort_direction = 'desc')}
									aria-pressed={sort_direction === 'desc'}
								>
									Newest
								</button>
								<button
									class="btn join-item btn-sm {sort_direction ===
									'asc'
										? 'btn-primary'
										: 'btn-ghost'}"
									onclick={() =>
										(inactive_state.sort_direction = 'asc')}
									aria-pressed={sort_direction === 'asc'}
								>
									Oldest
								</button>
							</div>
						</div>

						<label class="label cursor-pointer gap-2">
							<span class="label-text">Never Posted Only</span>
							<input
								type="checkbox"
								class="checkbox"
								bind:checked={inactive_state.show_never_posted}
								aria-label="Show only users who never posted"
							/>
						</label>
					</div>
				</section>

				<!-- Open All Profiles Button -->
				<div class="mt-4 flex justify-end">
					<button
						class="btn btn-primary"
						onclick={open_all_profiles}
						aria-label={`Open all ${inactive_follows.length} profiles in new tabs`}
					>
						Open All Profiles ({inactive_follows.length})
					</button>
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
