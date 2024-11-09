<script lang="ts">
	import {
		Bell,
		Comment,
		InformationCircle,
		People,
	} from '$lib/icons';
	import { user_store } from '$lib/user-data.svelte';

	let expanded_clusters = $state<string[]>([]);

	const toggle_cluster = (cluster_name: string) => {
		if (expanded_clusters.includes(cluster_name)) {
			expanded_clusters = expanded_clusters.filter(
				(name) => name !== cluster_name,
			);
		} else {
			expanded_clusters = [...expanded_clusters, cluster_name];
		}
	};

	const is_expanded = (cluster_name: string) =>
		expanded_clusters.includes(cluster_name);
</script>

{#if user_store.data.network}
	<article class="card mb-11 bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title mb-4">
				Network Analysis
				<div
					class="tooltip"
					data-tip="Analysis of your interactions and connections with other users"
				>
					<InformationCircle
						class_names="h-5 w-5 text-base-content/60"
					/>
				</div>
			</h2>

			<!-- Interaction Stats -->
			<section class="mb-6">
				<h3
					class="mb-2 flex items-center gap-2 text-lg font-semibold"
				>
					Top Interactions
					<div
						class="tooltip"
						data-tip="Users you most frequently engage with through replies and mentions"
					>
						<InformationCircle
							class_names="h-4 w-4 text-base-content/60"
						/>
					</div>
				</h3>
				<p class="mb-4 text-sm text-base-content/60">
					Shows who you interact with most through replies, quotes,
					and mentions across your posts.
				</p>
				<div class="grid gap-4 md:grid-cols-2">
					<!-- Most Replied To -->
					<section class="card bg-base-200">
						<div class="card-body">
							<h4 class="card-title text-sm">
								<Comment class_names="h-5 w-5" />
								Most Replied To
							</h4>
							<dl class="space-y-2">
								{#each user_store.data.network.interaction_network.most_replied_to.slice(0, 5) as [handle, count]}
									<div class="flex items-center justify-between">
										<dt>
											<a
												href={`https://bsky.app/profile/${handle}`}
												class="link link-primary text-sm"
												target="_blank"
												rel="noopener noreferrer"
											>
												@{handle}
											</a>
										</dt>
										<dd class="badge badge-primary">{count}</dd>
									</div>
								{/each}
							</dl>
						</div>
					</section>

					<!-- Most Mentioned -->
					<section class="card bg-base-200">
						<div class="card-body">
							<h4 class="card-title text-sm">
								<Bell class_names="h-5 w-5" />
								Most Mentioned
							</h4>
							<dl class="space-y-2">
								{#each user_store.data.network.interaction_network.most_mentioned.slice(0, 5) as [handle, count]}
									<div class="flex items-center justify-between">
										<dt>
											<a
												href={`https://bsky.app/profile/${handle}`}
												class="link link-primary text-sm"
												target="_blank"
												rel="noopener noreferrer"
											>
												@{handle}
											</a>
										</dt>
										<dd class="badge badge-secondary">{count}</dd>
									</div>
								{/each}
							</dl>
						</div>
					</section>
				</div>
			</section>

			<!-- Community Analysis -->
			{#if user_store.data.network.community_detection.interaction_clusters.length > 0}
				<section>
					<h3
						class="mb-2 flex items-center gap-2 text-lg font-semibold"
					>
						Community Analysis
						<div
							class="tooltip"
							data-tip="Groups of users you regularly interact with"
						>
							<InformationCircle
								class_names="h-4 w-4 text-base-content/60"
							/>
						</div>
					</h3>
					<div class="grid gap-4 md:grid-cols-1">
						{#each user_store.data.network.community_detection.interaction_clusters as cluster}
							<article class="card bg-base-200">
								<div class="card-body">
									<header
										class="flex flex-col gap-2 sm:flex-row sm:items-center"
									>
										<div class="card-title text-sm">
											<People class_names="h-5 w-5" />
											{cluster.name}
										</div>
										<span class="badge badge-accent">
											{cluster.interaction_count} interactions
										</span>
									</header>
									<div class="mt-2">
										<nav
											class="flex flex-wrap gap-1"
											aria-label="Community members"
										>
											{#each cluster.users.slice(0, is_expanded(cluster.name) ? cluster.users.length : 15) as user}
												<a
													href={`https://bsky.app/profile/${user}`}
													class="badge badge-outline badge-md transition-colors hover:border-primary hover:bg-primary hover:text-primary-content hover:no-underline"
													target="_blank"
													rel="noopener noreferrer"
													title={user}
												>
													{user.split('.')[0]}
												</a>
											{/each}
											{#if cluster.users.length > 15}
												<button
													class="badge badge-ghost badge-md cursor-pointer transition-colors hover:border-base-300 hover:bg-base-300"
													onclick={() => toggle_cluster(cluster.name)}
													aria-expanded={is_expanded(cluster.name)}
												>
													{#if is_expanded(cluster.name)}
														Show Less
													{:else}
														+{cluster.users.length - 15} more
													{/if}
												</button>
											{/if}
										</nav>
									</div>
								</div>
							</article>
						{/each}
					</div>
				</section>
			{/if}
		</div>
	</article>
{/if}
