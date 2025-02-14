<script lang="ts">
	import { number_crunch } from '$lib/number-crunch';
	import { user_store } from '$lib/user-data.svelte';
	import { get_tooltip_props } from '$lib/utils';

	// Create derived values with null checks
	let followers_count = $derived(
		user_store.data.profile?.followersCount ?? 0,
	);
	let follows_count = $derived(
		user_store.data.profile?.followsCount ?? 0,
	);
	let posts_count = $derived(
		user_store.data.profile?.postsCount ?? 0,
	);
</script>

{#if user_store.data?.profile}
	<article class="card bg-base-100 mb-11 shadow-xl">
		<figure class="relative h-40 w-full md:h-52">
			{#if user_store.data.profile.banner}
				<img
					src={user_store.data.profile.banner}
					alt={`${user_store.data.profile.displayName}'s profile banner`}
					class="h-full w-full object-cover"
				/>
			{:else}
				<div class="bg-base-200 h-full w-full"></div>
			{/if}
		</figure>
		<div class="relative px-4 pt-4 pb-6 md:px-8">
			{#if user_store.data.profile.avatar}
				<div
					class="avatar absolute -top-12 left-1/2 -translate-x-1/2 md:left-8 md:translate-x-0"
				>
					<div
						class="ring-primary ring-offset-base-100 w-20 rounded-full ring ring-offset-2 md:w-24"
					>
						<img
							src={user_store.data.profile.avatar}
							alt={`${user_store.data.profile.displayName}'s profile picture`}
						/>
					</div>
				</div>
			{/if}
			<header class="mt-10 mb-4 text-center md:mt-14 md:text-left">
				<h1
					class="card-title justify-center text-xl md:justify-start md:text-2xl"
				>
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
				<p class="text-base-content/40 mt-1 font-mono text-xs">
					{user_store.data.profile.did}
				</p>
			</header>

			<section
				class="stats stats-vertical sm:stats-horizontal mb-4 w-full shadow"
				aria-label="Profile statistics"
			>
				<div class="stat">
					<div class="stat-title">Followers</div>
					<div class="stat-value">
						<span {...get_tooltip_props(followers_count)}>
							{number_crunch(followers_count)}
						</span>
					</div>
				</div>

				<div class="stat">
					<div class="stat-title">Following</div>
					<div class="stat-value">
						<span {...get_tooltip_props(follows_count)}>
							{number_crunch(follows_count)}
						</span>
					</div>
				</div>

				<div class="stat">
					<div class="stat-title">Posts</div>
					<div class="stat-value">
						<span {...get_tooltip_props(posts_count)}>
							{number_crunch(posts_count)}
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
					<p class="text-base-content/80 whitespace-pre-line">
						{user_store.data.profile.description}
					</p>
				</section>
			{/if}

			<footer class="card-actions mt-4 justify-end">
				<a
					href={`/${user_store.data.profile.handle}/inactive`}
					class="btn btn-ghost btn-sm"
				>
					View Inactive Follows
				</a>
			</footer>
		</div>
	</article>
{/if}
