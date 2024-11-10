<script lang="ts">
	import { InformationCircle } from '$lib/icons';
	import { user_store } from '$lib/user-data.svelte';

	let is_loading = $state(false);
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

<div class="card bg-base-200 shadow-lg">
	<div class="card-body">
		<div class="flex items-start gap-4">
			<div class="flex-none">
				<InformationCircle class_names="h-5 w-5 text-info" />
			</div>
			<div class="flex-1">
				<h3 class="card-title text-lg">Analysis Scope</h3>
				<div
					class="stats stats-vertical my-4 w-full shadow lg:stats-horizontal"
				>
					<div class="stat">
						<div class="stat-title">Analysed Posts</div>
						<div class="stat-value text-primary">
							{analysed_posts}
						</div>
						<div class="stat-desc">most recent posts</div>
					</div>
					<div class="stat">
						<div class="stat-title">Total Posts</div>
						<div class="stat-value">{total_posts}</div>
						<div class="stat-desc">all time</div>
					</div>
				</div>

				<div class="alert alert-info">
					<InformationCircle class_names="h-4 w-4" />
					<span>
						Analysis is based on your {max_posts} most recent posts to
						provide relevant insights about current posting patterns.
						{#if total_posts > max_posts}
							This represents {percentage}% of your total posts.
						{/if}
					</span>
				</div>
			</div>
		</div>
	</div>
</div>
