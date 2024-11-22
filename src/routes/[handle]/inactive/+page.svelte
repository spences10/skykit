<script lang="ts">
	import { enhance } from '$app/forms';
	import { InactiveFollows } from '$lib/components';
	import type { InactiveFollow } from '$lib/types';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();
	let loading = $state(false);
	let days_threshold = $state(30);
	let inactive_follows = $state<InactiveFollow[]>([]);
	let error = $state<string | undefined>(undefined);

	const handle_form_submit = ({ result }: { result: any }) => {
		loading = false;
		if (result) {
			if (result.data.success) {
				inactive_follows = result.data.inactive_follows;
				error = undefined;
			} else {
				error = result.data.error;
				inactive_follows = [];
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
	<nav class="mb-4">
		<a href="/{data.profile.handle}" class="btn btn-ghost">
			← Back to Profile
		</a>
	</nav>

	<h1 class="mb-6 text-2xl font-bold">
		Inactive Follows for @{data.profile.handle}
	</h1>

	<div class="card mb-6 bg-base-100 shadow-xl">
		<div class="card-body">
			<form
				method="POST"
				action="?/check_inactive"
				use:enhance={() => {
					loading = true;
					error = undefined;
					return async ({ result }) => handle_form_submit({ result });
				}}
			>
				<div class="flex items-end gap-4">
					<div class="form-control w-full max-w-xs">
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
					<button
						type="submit"
						class="btn btn-primary"
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
					<div class="stats shadow">
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

	<InactiveFollows {inactive_follows} {loading} />
</main>
