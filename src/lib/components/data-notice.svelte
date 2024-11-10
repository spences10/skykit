<script lang="ts">
	import { InformationCircle } from '$lib/icons';
	import { user_store } from '$lib/user-data.svelte';

	const max_posts = 100; // We can only analyze 100 posts at a time

	// Use derived values from the store
	let total_posts = $derived(
		user_store.data.profile?.postsCount ?? 0,
	);
	let analysed_posts = $derived(
		user_store.data.content?.post_types?.original_posts ?? 0,
	);

	const percentage = $derived(
		Math.round((analysed_posts / total_posts) * 100),
	);
</script>

<article class="card mb-11 bg-base-200 shadow-xl">
	<div class="card-body">
		<header class="mb-4 flex items-center gap-2">
			<h2 class="card-title">
				Analysis Scope
				<div
					class="tooltip cursor-pointer"
					data-tip="Overview of how many posts are included in this analysis"
				>
					<InformationCircle
						class_names="h-5 w-5 text-base-content/60"
					/>
				</div>
			</h2>
		</header>

		<section class="mb-6">
			<dl
				class="stats stats-vertical w-full shadow lg:stats-horizontal"
			>
				<div class="stat">
					<dt class="stat-title">Analysed Posts</dt>
					<dd class="stat-value text-primary">{analysed_posts}</dd>
					<dd class="stat-desc">most recent posts</dd>
				</div>
				<div class="stat">
					<dt class="stat-title">Total Posts</dt>
					<dd class="stat-value">{total_posts}</dd>
					<dd class="stat-desc">all time</dd>
				</div>
			</dl>
		</section>

		<div class="alert alert-info">
			<InformationCircle class_names="h-4 w-4" />
			<span>
				Analysis is based on your {max_posts} most recent posts to provide
				relevant insights about current posting patterns.
				{#if total_posts > max_posts}
					This represents {percentage}% of your total posts.
				{/if}
			</span>
		</div>
	</div>
</article>
