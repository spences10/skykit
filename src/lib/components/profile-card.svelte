<script lang="ts">
	import { number_crunch } from '$lib/number-crunch';
	import { user_store } from '$lib/user-data.svelte';
	import { format_date, get_tooltip_props } from '$lib/utils';
</script>

{#if user_store.data?.profile}
	<article class="card mb-11 bg-base-100 shadow-xl">
		<div class="card-body">
			<header class="mb-4 flex items-center gap-4">
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
					<h1 class="card-title text-2xl">
						{user_store.data.profile.displayName}
					</h1>
					<p class="text-base-content/60">
						<a
							href={`https://bsky.app/profile/${user_store.data.profile.handle}`}
							target="_blank"
							rel="noopener noreferrer"
						>
							@{user_store.data.profile.handle}
						</a>
					</p>
					<p class="mt-1 font-mono text-xs text-base-content/40">
						{user_store.data.profile.did}
					</p>
				</div>
			</header>

			<section
				class="stats stats-vertical mb-4 shadow sm:stats-horizontal"
				aria-label="Profile statistics"
			>
				<div class="stat">
					<div class="stat-title">Followers</div>
					<div class="stat-value">
						<span
							{...get_tooltip_props(
								user_store.data.profile.followersCount,
							)}
						>
							{number_crunch(user_store.data.profile.followersCount)}
						</span>
					</div>
				</div>

				<div class="stat">
					<div class="stat-title">Following</div>
					<div class="stat-value">
						<span
							{...get_tooltip_props(
								user_store.data.profile.followsCount,
							)}
						>
							{number_crunch(user_store.data.profile.followsCount)}
						</span>
					</div>
				</div>

				<div class="stat">
					<div class="stat-title">Posts</div>
					<div class="stat-value">
						<span
							{...get_tooltip_props(
								user_store.data.profile.postsCount,
							)}
						>
							{number_crunch(user_store.data.profile.postsCount)}
						</span>
					</div>
				</div>
			</section>

			{#if user_store.data.profile.description}
				<section
					class="profile-description"
					aria-label="Profile description"
				>
					<div class="divider"></div>
					<p class="whitespace-pre-line text-base-content/80">
						{user_store.data.profile.description}
					</p>
				</section>
			{/if}

			<footer class="card-actions mt-4 justify-end">
				<time
					class="text-sm text-base-content/60"
					datetime={user_store.data.profile.indexedAt}
				>
					Last updated: {format_date(
						user_store.data.profile.indexedAt,
					)}
				</time>
			</footer>
		</div>
	</article>
{/if}
