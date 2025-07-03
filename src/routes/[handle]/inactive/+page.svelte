<script lang="ts">
	import { InactiveFollows } from '$lib/components';
	import { MAX_INACTIVE_FOLLOWS_LIMIT } from '$lib/constants';
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

	// Check if the user follows too many people
	const follows_count = $derived(data.profile?.followsCount || 0);
	const exceeds_limit = $derived(
		follows_count > MAX_INACTIVE_FOLLOWS_LIMIT,
	);

	const handle_form_submit = async () => {
		if (exceeds_limit) {
			return; // Don't submit if limit is exceeded
		}
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
		class="card bg-base-100 mb-6 shadow-xl"
		aria-label="Inactive follows controls"
	>
		<div class="card-body">
			{#if exceeds_limit}
				<!-- Warning message when limit is exceeded -->
				<div class="alert alert-warning mb-4" role="alert">
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
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
						/>
					</svg>
					<div>
						<h3 class="text-lg font-bold">Too Many Follows!</h3>
						<p class="text-sm">
							This account follows <strong>
								{follows_count.toLocaleString()}
							</strong>
							people, which exceeds the server limit of
							<strong>
								{MAX_INACTIVE_FOLLOWS_LIMIT.toLocaleString()}
							</strong>.
						</p>
						<p class="mt-2 text-sm">
							🚀💥 This is a free service - please don't abuse it.
						</p>
					</div>
				</div>
			{/if}

			<!-- Search Form -->
			<form
				method="POST"
				action="?/check_inactive"
				onsubmit={(e) => {
					e.preventDefault();
					handle_form_submit();
				}}
				aria-label="Inactive follows search form"
				class="flex flex-col gap-4 sm:flex-row {exceeds_limit
					? 'opacity-50'
					: ''}"
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
							disabled={exceeds_limit}
						/>
						<span class="btn join-item btn-neutral no-animation">
							days
						</span>
					</div>
				</div>
				<button
					type="submit"
					class="btn btn-primary w-full self-end sm:ml-auto sm:w-auto"
					disabled={loading || exceeds_limit}
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
					class="stats stats-vertical bg-base-200 sm:stats-horizontal w-full shadow-sm"
				>
					<!-- Sort Controls -->
					<div class="stat">
						<div class="stat-title">Sort by Last Post</div>
						<div class="stat-actions mt-2">
							<div
								class="join border-primary rounded-box w-full border"
							>
								<button
									class="btn join-item rounded-l-box flex-1 {sort_direction ===
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
									class="btn join-item rounded-r-box flex-1 {sort_direction ===
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
						class="stats stats-vertical bg-base-200 sm:stats-horizontal w-full shadow-sm"
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
