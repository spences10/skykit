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
	<article class="card mb-11 bg-base-100 shadow-xl">
		{#if user_store.data.profile.banner}
			<figure class="relative h-40 w-full md:h-52">
				<img
					src={user_store.data.profile.banner}
					alt={`${user_store.data.profile.displayName}'s profile banner`}
					class="h-full w-full object-cover"
				/>
			</figure>
		{/if}
		<div class="relative px-4 pb-6 pt-4 md:px-8">
			{#if user_store.data.profile.avatar}
				<div
					class="avatar absolute -top-12 left-1/2 -translate-x-1/2 md:left-8 md:translate-x-0"
				>
					<div
						class="w-20 rounded-full ring ring-primary ring-offset-2 ring-offset-base-100 md:w-24"
					>
						<img
							src={user_store.data.profile.avatar}
							alt={`${user_store.data.profile.displayName}'s profile picture`}
						/>
					</div>
				</div>
			{/if}
			<header class="mb-4 mt-10 text-center md:mt-14 md:text-left">
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
				<p class="mt-1 font-mono text-xs text-base-content/40">
					{user_store.data.profile.did}
				</p>
			</header>

			<section
				class="stats stats-vertical mb-4 w-full shadow sm:stats-horizontal"
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
					<p class="whitespace-pre-line text-base-content/80">
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
