<script lang="ts">
	import { InformationCircle } from '$lib/icons';
	import { user_store } from '$lib/user-data.svelte';

	let conversation_starter_rate = $derived.by(() => {
		if (!user_store.data.engagement) return '0';
		return (
			(user_store.data.engagement.engagement_distribution.replies.filter(
				(count: number) => count > 0,
			).length /
				user_store.data.engagement.total_posts) *
			100
		).toFixed(0);
	});
</script>

{#if user_store.data.engagement}
	<section class="mb-6">
		<h3 class="mb-2 flex items-center gap-2 text-lg font-semibold">
			Conversation Metrics
			<div
				class="tooltip cursor-pointer"
				data-tip="How your posts contribute to and spark discussions"
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
				<dt class="stat-title">Conversation Starter Rate</dt>
				<dd class="stat-value">{conversation_starter_rate}%</dd>
				<dd class="stat-desc">
					Posts that received replies from others
				</dd>
			</div>

			<div class="stat">
				<dt class="stat-title">Reply Rate</dt>
				<dd class="stat-value">
					{user_store.data.engagement.reply_rate.toFixed(0)}%
				</dd>
				<dd class="stat-desc">
					Your posts that are replies to others
				</dd>
			</div>
		</dl>
	</section>
{/if}
