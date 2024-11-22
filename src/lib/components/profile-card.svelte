<script lang="ts">
	import { number_crunch } from '$lib/number-crunch';
	import { user_store } from '$lib/user-data.svelte';
	import { get_tooltip_props } from '$lib/utils';
	import { formatDistance, isValid, parseISO } from 'date-fns';

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
	let indexed_at = $derived(user_store.data.profile?.indexedAt ?? '');

	const format_indexed_time = (date_string: string): string => {
		try {
			const date = parseISO(date_string);
			if (!isValid(date)) return 'Unknown';
			return formatDistance(date, new Date(), { addSuffix: true });
		} catch (err) {
			console.error('Error formatting indexed time:', err);
			return 'Unknown';
		}
	};
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
				{#if indexed_at}
					<time
						class="text-sm text-base-content/60"
						datetime={indexed_at}
					>
						Last updated: {format_indexed_time(indexed_at)}
					</time>
				{/if}
			</footer>
		</div>
	</article>
{/if}
