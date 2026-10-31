<script lang="ts">
	import { number_crunch } from '#lib/number-crunch.js';
	import { user_store } from '#lib/user-data.svelte.js';
	import { get_tooltip_props } from '#lib/utils.js';
	import Info from '@lucide/svelte/icons/info';
	import MessageSquareMore from '@lucide/svelte/icons/message-square-more';
	import SquarePen from '@lucide/svelte/icons/square-pen';
	import Upload from '@lucide/svelte/icons/upload';
</script>

<section class="mb-6">
	<h3 class="mb-2 flex items-center gap-2 text-lg font-semibold">
		Post Types
		<div
			class="tooltip cursor-pointer"
			data-tip="Breakdown of your posts by type (original posts, replies, and reposts)"
		>
			<Info class="h-4 w-4 text-base-content/60" />
		</div>
	</h3>
	<dl class="stats w-full stats-vertical shadow md:stats-horizontal">
		<div class="stat">
			<dt class="stat-figure text-primary">
				<SquarePen />
			</dt>
			<dd class="stat-title">Original Posts</dd>
			<dd class="stat-value text-primary">
				<span
					{...get_tooltip_props(
						user_store.data.content.post_types.text_only,
					)}
				>
					{number_crunch(
						user_store.data.content.post_types.text_only,
					)}
				</span>
			</dd>
			<dd class="stat-desc">Direct posts to your feed</dd>
		</div>

		<div class="stat">
			<dt class="stat-figure text-secondary">
				<MessageSquareMore />
			</dt>
			<dd class="stat-title">Replies</dd>
			<dd class="stat-value text-secondary">
				<span
					{...get_tooltip_props(
						user_store.data.content.post_types.replies,
					)}
				>
					{number_crunch(user_store.data.content.post_types.replies)}
				</span>
			</dd>
			<dd class="stat-desc">Responses to other posts</dd>
		</div>

		<div class="stat">
			<dt class="stat-figure text-accent">
				<Upload />
			</dt>
			<dd class="stat-title">Reposts</dd>
			<dd class="stat-value text-accent">
				<span
					{...get_tooltip_props(
						user_store.data.content.post_types.reposts,
					)}
				>
					{number_crunch(user_store.data.content.post_types.reposts)}
				</span>
			</dd>
			<dd class="stat-desc">Shared posts from others</dd>
		</div>
	</dl>
</section>
