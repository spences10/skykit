<script lang="ts">
	import { Image, InformationCircle, Link } from '$lib/icons';
	import { number_crunch } from '$lib/number-crunch';
	import { user_store } from '$lib/user-data.svelte';
	import { get_tooltip_props } from '$lib/utils';
</script>

<section class="mb-6">
	<h3 class="mb-2 flex items-center gap-2 text-lg font-semibold">
		Content Style
		<div
			class="tooltip cursor-pointer"
			data-tip="How you format your original posts with media and external links"
		>
			<InformationCircle class_names="h-4 w-4 text-base-content/60" />
		</div>
	</h3>
	<dl class="stats stats-vertical w-full shadow sm:stats-horizontal">
		<div class="stat">
			<dt class="stat-figure text-info">
				<Image />
			</dt>
			<dd class="stat-title">Media Posts</dd>
			<dd class="stat-value text-info">
				<span
					{...get_tooltip_props(
						user_store.data.content.post_types.with_media,
					)}
				>
					{number_crunch(
						user_store.data.content.post_types.with_media,
					)}
				</span>
			</dd>
			<dd class="stat-desc">Posts containing images</dd>
		</div>

		<div class="stat">
			<dt class="stat-figure text-success">
				<Link />
			</dt>
			<dd class="stat-title">Posts with Links</dd>
			<dd class="stat-value text-success">
				<span
					{...get_tooltip_props(
						user_store.data.content.post_types.with_links,
					)}
				>
					{number_crunch(
						user_store.data.content.post_types.with_links,
					)}
				</span>
			</dd>
			<dd class="stat-desc">Posts containing external links</dd>
		</div>
	</dl>
</section>
