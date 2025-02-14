<script lang="ts">
	import { InformationCircle } from '$lib/icons';
	import { user_store } from '$lib/user-data.svelte';
</script>

{#if user_store.data.engagement}
	<section class="mb-6">
		<h3 class="mb-2 flex items-center gap-2 text-lg font-semibold">
			Interaction Patterns
			<div
				class="tooltip cursor-pointer"
				data-tip="How your posts receive engagement from others"
			>
				<InformationCircle
					class_names="h-4 w-4 text-base-content/60"
				/>
			</div>
		</h3>
		<dl
			class="stats stats-vertical md:stats-horizontal w-full shadow"
		>
			<div class="stat">
				<dt class="stat-title">Reply Engagement</dt>
				<dd class="stat-value">
					{user_store.data.engagement.reply_rate.toFixed(0)}%
				</dd>
				<dd class="stat-desc">Posts that received replies</dd>
			</div>

			<div class="stat">
				<dt class="stat-title">Repost Rate</dt>
				<dd class="stat-value">
					{user_store.data.engagement.repost_rate.toFixed(0)}%
				</dd>
				<dd class="stat-desc">
					{#if user_store.data.engagement.repost_rate >= 100}
						All your posts get reposted! 🔥
					{:else}
						Percentage of posts that get reposted
					{/if}
				</dd>
			</div>
		</dl>
	</section>
{/if}
