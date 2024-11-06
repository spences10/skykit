<script lang="ts">
	interface Profile {
		did: string;
		handle: string;
		displayName: string;
		description?: string;
		avatar?: string;
		followersCount: number;
		followsCount: number;
		postsCount: number;
		indexedAt: string;
	}

	let { data } = $props();
	let { profile } = data as { profile: Profile };

	const format_date = (date_string: string) => {
		return new Date(date_string).toLocaleString();
	};
</script>

<div class="container mx-auto max-w-3xl p-4">
	<div class="mb-4">
		<a href="/" class="btn btn-ghost"> ← Back to Search </a>
	</div>

	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<div class="mb-4 flex items-center gap-4">
				{#if profile.avatar}
					<div class="avatar">
						<div
							class="w-24 rounded-full ring ring-primary ring-offset-2 ring-offset-base-100"
						>
							<img
								src={profile.avatar}
								alt={`${profile.displayName}'s profile picture`}
							/>
						</div>
					</div>
				{/if}
				<div>
					<h2 class="card-title text-2xl">
						{profile.displayName}
					</h2>
					<p class="text-base-content/60">@{profile.handle}</p>
					<p class="mt-1 font-mono text-xs text-base-content/40">
						{profile.did}
					</p>
				</div>
			</div>

			<div class="stats mb-4 shadow">
				<div class="stat">
					<div class="stat-title">Followers</div>
					<div class="stat-value">{profile.followersCount}</div>
				</div>

				<div class="stat">
					<div class="stat-title">Following</div>
					<div class="stat-value">{profile.followsCount}</div>
				</div>

				<div class="stat">
					<div class="stat-title">Posts</div>
					<div class="stat-value">{profile.postsCount}</div>
				</div>
			</div>

			{#if profile.description}
				<div class="divider"></div>
				<p class="text-base-content/80">{profile.description}</p>
			{/if}

			<div class="card-actions mt-4 justify-end">
				<div class="text-sm text-base-content/60">
					Last updated: {format_date(profile.indexedAt)}
				</div>
			</div>
		</div>
	</div>
</div>
