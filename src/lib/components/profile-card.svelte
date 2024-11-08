<script lang="ts">
	import { number_crunch } from '$lib/number-crunch';
	import { user_store } from '$lib/user-data.svelte';

	const format_date = (date_string: string) => {
		return new Date(date_string).toLocaleString();
	};
</script>

{#if user_store.data.profile}
	<div class="card mb-4 bg-base-100 shadow-xl">
		<div class="card-body">
			<div class="mb-4 flex items-center gap-4">
				{#if user_store.data.profile.avatar}
					<div class="avatar">
						<div
							class="w-24 rounded-full ring ring-primary ring-offset-2 ring-offset-base-100"
						>
							<img
								src={user_store.data.profile.avatar}
								alt={`${user_store.data.profile.displayName}'s profile picture`}
							/>
						</div>
					</div>
				{/if}
				<div>
					<h2 class="card-title text-2xl">
						{user_store.data.profile.displayName}
					</h2>
					<p class="text-base-content/60">
						@{user_store.data.profile.handle}
					</p>
					<p class="mt-1 font-mono text-xs text-base-content/40">
						{user_store.data.profile.did}
					</p>
				</div>
			</div>

			<div class="stats mb-4 shadow">
				<div class="stat">
					<div class="stat-title">Followers</div>
					<div class="stat-value">
						{number_crunch(user_store.data.profile.followersCount)}
					</div>
				</div>

				<div class="stat">
					<div class="stat-title">Following</div>
					<div class="stat-value">
						{number_crunch(user_store.data.profile.followsCount)}
					</div>
				</div>

				<div class="stat">
					<div class="stat-title">Posts</div>
					<div class="stat-value">
						{number_crunch(user_store.data.profile.postsCount)}
					</div>
				</div>
			</div>

			{#if user_store.data.profile.description}
				<div class="divider"></div>
				<p class="whitespace-pre-line text-base-content/80">
					{user_store.data.profile.description}
				</p>
			{/if}

			<div class="card-actions mt-4 justify-end">
				<div class="text-sm text-base-content/60">
					Last updated: {format_date(
						user_store.data.profile.indexedAt,
					)}
				</div>
			</div>
		</div>
	</div>
{/if}
