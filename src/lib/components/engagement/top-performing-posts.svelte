<script lang="ts">
	import {
		Comment,
		Heart,
		InformationCircle,
		LinkOutgoing,
		Refresh,
	} from '$lib/icons';
	import { number_crunch } from '$lib/number-crunch';
	import { user_store } from '$lib/user-data.svelte';
	import { get_tooltip_props } from '$lib/utils';
	import { slide } from 'svelte/transition';

	let show_all_top_posts = $state(false);
	let top_posts = $derived(
		user_store.data.engagement?.top_performing_posts ?? [],
	);
</script>

{#if top_posts.length > 0}
	<section class="mt-4">
		<header class="mb-2 flex items-center justify-between">
			<h3 class="flex items-center gap-2 text-lg font-semibold">
				Top Performing Posts
				<div
					class="tooltip cursor-pointer"
					data-tip="Your posts with the highest total engagement"
				>
					<InformationCircle
						class_names="h-4 w-4 text-base-content/60"
					/>
				</div>
			</h3>
			{#if top_posts.length > 1}
				<button
					class="btn btn-ghost btn-sm"
					onclick={() => (show_all_top_posts = !show_all_top_posts)}
				>
					{show_all_top_posts ? 'Show Less' : 'Show More'}
				</button>
			{/if}
		</header>

		<div class="space-y-4">
			<!-- First post always shown -->
			<div class="card shadow">
				<div class="card-body p-4">
					<p class="mb-4 text-base">
						{(top_posts[0].post.record as any).text}
					</p>
					<div class="flex items-center gap-6">
						<button class="btn btn-ghost btn-sm text-primary gap-2">
							<Heart class_names="h-6 w-6" />
							<span
								{...get_tooltip_props(
									top_posts[0].post.likeCount || 0,
								)}
							>
								{number_crunch(top_posts[0].post.likeCount || 0)}
							</span>
						</button>
						<button class="btn btn-ghost btn-sm text-secondary gap-2">
							<Refresh class_names="h-6 w-6" />
							<span
								{...get_tooltip_props(
									top_posts[0].post.repostCount || 0,
								)}
							>
								{number_crunch(top_posts[0].post.repostCount || 0)}
							</span>
						</button>
						<button class="btn btn-ghost btn-sm text-accent gap-2">
							<Comment class_names="h-6 w-6" />
							<span
								{...get_tooltip_props(
									top_posts[0].post.replyCount || 0,
								)}
							>
								{number_crunch(top_posts[0].post.replyCount || 0)}
							</span>
						</button>
						<a
							href={`https://bsky.app/profile/${top_posts[0].post.author.handle}/post/${top_posts[0].post.uri.split('/').pop()}`}
							target="_blank"
							rel="noopener noreferrer"
							class="btn btn-ghost btn-sm text-info gap-2"
						>
							<LinkOutgoing class_names="h-6 w-6" />
							<span class="sr-only">View post</span>
						</a>
					</div>
				</div>
			</div>

			{#if show_all_top_posts}
				<div transition:slide>
					{#each top_posts.slice(1, 10) as post}
						<div class="card mb-4 shadow">
							<div class="card-body p-4">
								<p class="mb-4 text-base">
									{(post.post.record as any).text}
								</p>
								<div class="flex items-center gap-6">
									<button
										class="btn btn-ghost btn-sm text-primary gap-2"
									>
										<Heart class_names="h-6 w-6" />
										<span
											{...get_tooltip_props(post.post.likeCount || 0)}
										>
											{number_crunch(post.post.likeCount || 0)}
										</span>
									</button>
									<button
										class="btn btn-ghost btn-sm text-secondary gap-2"
									>
										<Refresh class_names="h-6 w-6" />
										<span
											{...get_tooltip_props(
												post.post.repostCount || 0,
											)}
										>
											{number_crunch(post.post.repostCount || 0)}
										</span>
									</button>
									<button
										class="btn btn-ghost btn-sm text-accent gap-2"
									>
										<Comment class_names="h-6 w-6" />
										<span
											{...get_tooltip_props(
												post.post.replyCount || 0,
											)}
										>
											{number_crunch(post.post.replyCount || 0)}
										</span>
									</button>
									<a
										href={`https://bsky.app/profile/${post.post.author.handle}/post/${post.post.uri.split('/').pop()}`}
										target="_blank"
										rel="noopener noreferrer"
										class="btn btn-ghost btn-sm text-info gap-2"
									>
										<LinkOutgoing class_names="h-6 w-6" />
										<span class="sr-only">View post</span>
									</a>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</section>
{/if}
