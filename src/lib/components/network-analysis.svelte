<script lang="ts">
	import { Bell, Comment, People } from '$lib/icons';
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
	<div class="card mb-11 bg-base-100 shadow-xl">
		<div class="card-body">
			<h2 class="card-title mb-4">Network Analysis</h2>

			<!-- Interaction Stats -->
			<div class="mb-6">
				<h3 class="mb-2 text-lg font-semibold">Top Interactions</h3>
				<div class="grid gap-4 md:grid-cols-2">
					<!-- Most Replied To -->
					<div class="card bg-base-200">
						<div class="card-body">
							<h4 class="card-title text-sm">
								<Comment class_names="h-5 w-5" />
								Most Replied To
							</h4>
							<div class="space-y-2">
								{#each user_store.data.network.interaction_network.most_replied_to.slice(0, 5) as [handle, count]}
									<div class="flex items-center justify-between">
										<a
											href={`https://bsky.app/profile/${handle}`}
											class="link link-primary text-sm"
											target="_blank"
											rel="noopener noreferrer"
										>
											@{handle}
										</a>
										<div class="badge badge-primary">{count}</div>
									</div>
								{/each}
							</div>
						</div>
					</div>

					<!-- Most Mentioned -->
					<div class="card bg-base-200">
						<div class="card-body">
							<h4 class="card-title text-sm">
								<Bell class_names="h-5 w-5" />
								Most Mentioned
							</h4>
							<div class="space-y-2">
								{#each user_store.data.network.interaction_network.most_mentioned.slice(0, 5) as [handle, count]}
									<div class="flex items-center justify-between">
										<a
											href={`https://bsky.app/profile/${handle}`}
											class="link link-primary text-sm"
											target="_blank"
											rel="noopener noreferrer"
										>
											@{handle}
										</a>
										<div class="badge badge-secondary">{count}</div>
									</div>
								{/each}
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Community Analysis -->
			{#if user_store.data.network.community_detection.interaction_clusters.length > 0}
				<div>
					<h3 class="mb-2 text-lg font-semibold">
						Community Analysis
					</h3>
					<div class="grid gap-4 md:grid-cols-1">
						{#each user_store.data.network.community_detection.interaction_clusters as cluster}
							<div class="card bg-base-200">
								<div class="card-body">
									<h4
										class="card-title flex items-center gap-2 text-sm"
									>
										<People class_names="h-5 w-5" />

										{cluster.name}
										<div class="badge badge-accent">
											{cluster.interaction_count} interactions
										</div>
									</h4>
									<div class="mt-2">
										<div class="flex flex-wrap gap-1">
											{#each cluster.users.slice(0, is_expanded(cluster.name) ? cluster.users.length : 15) as user}
												<a
													href={`https://bsky.app/profile/${user}`}
													class="badge badge-outline badge-md hover:badge-primary"
													target="_blank"
													rel="noopener noreferrer"
												>
													{user}
												</a>
											{/each}
											{#if cluster.users.length > 15}
												<button
													class="badge badge-ghost badge-lg cursor-pointer hover:bg-base-300"
													onclick={() => toggle_cluster(cluster.name)}
												>
													{#if is_expanded(cluster.name)}
														Show Less
													{:else}
														+{cluster.users.length - 15} more
													{/if}
												</button>
											{/if}
										</div>
									</div>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
