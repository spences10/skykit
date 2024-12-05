<script lang="ts">
	import { InformationCircle } from '$lib/icons';
	import { user_store } from '$lib/user-data.svelte';
	import { format_display_number } from '$lib/utils';
	import { format, isValid, parseISO } from 'date-fns';

	const max_posts = 100;

	let total_posts = $derived(
		user_store.data.profile?.postsCount ?? 0,
	);
	let analysed_posts = $derived(
		(user_store.data.content?.post_types?.text_only ?? 0) +
			(user_store.data.content?.post_types?.with_media ?? 0) +
			(user_store.data.content?.post_types?.with_links ?? 0),
	);

	let percentage = $derived(
		Math.round((analysed_posts / total_posts) * 100),
	);

	const format_date_range = (from: string, to: string): string => {
		try {
			const from_date = parseISO(from);
			const to_date = parseISO(to);

			if (!isValid(from_date) || !isValid(to_date)) {
				return 'Invalid date range';
			}

			return `${format(from_date, 'PP')} to ${format(to_date, 'PP')}`;
		} catch (err) {
			console.error('Error formatting date range:', err);
			return 'Invalid date range';
		}
	};

	let date_range = $derived(
		user_store.data.temporal?.posting_frequency.date_range
			? format_date_range(
					user_store.data.temporal.posting_frequency.date_range.from,
					user_store.data.temporal.posting_frequency.date_range.to,
				)
			: '',
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
					<dd class="stat-value text-primary">
						{format_display_number(analysed_posts)}
					</dd>
					<dd class="stat-desc">most recent posts</dd>
				</div>
				<div class="stat">
					<dt class="stat-title">Total Posts</dt>
					<dd class="stat-value">
						{format_display_number(total_posts)}
					</dd>
					<dd class="stat-desc">all time</dd>
				</div>
			</dl>
		</section>

		<div class="alert alert-info">
			<InformationCircle class_names="h-4 w-4" />
			<span>
				Analysis is based on {format_display_number(analysed_posts)} posts
				{#if date_range}
					from {date_range}
				{/if}
				to provide relevant insights about current posting patterns.
				{#if total_posts > max_posts}
					This represents {percentage}% of your total posts.
				{/if}
			</span>
		</div>
	</div>
</article>
