<script lang="ts">
	import { user_store } from '#lib/user-data.svelte.js';
	import Calendar from '@lucide/svelte/icons/calendar';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import Info from '@lucide/svelte/icons/info';
	import Zap from '@lucide/svelte/icons/zap';
</script>

{#if user_store.data.temporal}
	<section class="mb-6">
		<h3 class="mb-2 flex items-center gap-2 text-lg font-semibold">
			Posting Frequency
			<div
				class="tooltip cursor-pointer"
				data-tip="How often you post and your consistency over time"
			>
				<Info class="h-4 w-4 text-base-content/60" />
			</div>
		</h3>
		<dl
			class="stats w-full stats-vertical shadow md:stats-horizontal"
		>
			<div class="stat">
				<dt class="stat-figure text-primary">
					<Calendar />
				</dt>
				<dd class="stat-title">Daily Posts</dd>
				<dd class="stat-value text-primary">
					{Math.round(
						user_store.data.temporal.posting_frequency.posts_per_day,
					)}
				</dd>
				<dd class="stat-desc">
					~{user_store.data.temporal.posting_frequency.posts_per_week.toFixed(
						0,
					)} posts per week
				</dd>
			</div>

			<div class="stat">
				<dt class="stat-figure text-secondary">
					<CircleCheck />
				</dt>
				<dd class="stat-title">Active Days</dd>
				<dd class="stat-value text-secondary">
					{user_store.data.temporal.posting_frequency.active_days_percentage.toFixed(
						0,
					)}%
				</dd>
				<dd class="stat-desc">
					Over {user_store.data.temporal.posting_frequency.date_range
						.total_days} days
				</dd>
			</div>

			<div class="stat">
				<dt class="stat-figure text-accent">
					<Zap />
				</dt>
				<dd class="stat-title">Posting Streak</dd>
				<dd class="stat-value text-accent">
					{user_store.data.temporal.posting_frequency.longest_streak}
				</dd>
				<dd class="stat-desc">Consecutive days posting</dd>
			</div>
		</dl>
	</section>
{/if}
