<script lang="ts">
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
	<div class="card mb-4 bg-base-100 shadow-xl">
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
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
									/>
								</svg>
								Most Replied To
							</h4>
							<div class="space-y-2">
								{#each user_store.data.network.interaction_network.most_replied_to.slice(0, 5) as [handle, count]}
									<div class="flex items-center justify-between">
										<a
											href={`https://bsky.app/profile/${handle}`}
											class="link link-primary text-sm"
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
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-5 w-5"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
									/>
								</svg>
								Most Mentioned
							</h4>
							<div class="space-y-2">
								{#each user_store.data.network.interaction_network.most_mentioned.slice(0, 5) as [handle, count]}
									<div class="flex items-center justify-between">
										<a
											href={`https://bsky.app/profile/${handle}`}
											class="link link-primary text-sm"
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
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-5 w-5"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
											/>
										</svg>
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
