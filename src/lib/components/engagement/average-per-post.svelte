<script lang="ts">
	import {
		Comment,
		Heart,
		InformationCircle,
		Refresh,
	} from '$lib/icons';
	import { user_store } from '$lib/user-data.svelte';
</script>

{#if user_store.data.engagement}
	<section class="mb-6">
		<h3 class="mb-2 flex items-center gap-2 text-lg font-semibold">
			Average Per Post
			<div
				class="tooltip cursor-pointer"
				data-tip="Average interactions received on your original posts"
			>
				<InformationCircle
					class_names="h-4 w-4 text-base-content/60"
				/>
			</div>
		</h3>
		<dl
			class="stats stats-vertical w-full shadow sm:stats-horizontal"
		>
			<div class="stat">
				<dt class="stat-figure text-primary">
					<Heart />
				</dt>
				<dd class="stat-title">Likes</dd>
				<dd class="stat-value text-primary">
					{user_store.data.engagement.avg_likes_per_post.toFixed(0)}
				</dd>
				<dd class="stat-desc">
					Total: {user_store.data.engagement.engagement_distribution
						.likes.length}
				</dd>
			</div>

			<div class="stat">
				<dt class="stat-figure text-secondary">
					<Refresh />
				</dt>
				<dd class="stat-title">Reposts</dd>
				<dd class="stat-value text-secondary">
					{user_store.data.engagement.avg_reposts_per_post.toFixed(0)}
				</dd>
				<dd class="stat-desc">
					Total: {user_store.data.engagement.engagement_distribution
						.reposts.length}
				</dd>
			</div>

			<div class="stat">
				<dt class="stat-figure text-accent">
					<Comment />
				</dt>
				<dd class="stat-title">Replies</dd>
				<dd class="stat-value text-accent">
					{user_store.data.engagement.avg_replies_per_post.toFixed(0)}
				</dd>
				<dd class="stat-desc">
					Total: {user_store.data.engagement.engagement_distribution
						.replies.length}
				</dd>
			</div>
		</dl>
	</section>
{/if}
