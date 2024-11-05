<script lang="ts">
  import { onMount } from 'svelte'
  
  let handle = ''
  let user_data: any = null
  let loading = false
  let error: string | null = null

  const fetch_user_stats = async () => {
    if (!handle) return
    
    loading = true
    error = null
    
    try {
      const response = await fetch(`/api/user?handle=${encodeURIComponent(handle)}`)
      if (!response.ok) throw new Error('Failed to fetch user data')
      user_data = await response.json()
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error occurred'
      user_data = null
    } finally {
      loading = false
    }
  }
</script>

<div class="container mx-auto p-4 max-w-2xl">
  <h1 class="text-3xl font-bold mb-6">Bluesky User Stats</h1>
  
  <div class="mb-6">
    <div class="flex gap-2">
      <input
        type="text"
        bind:value={handle}
        placeholder="Enter Bluesky handle (e.g. alice.bsky.social)"
        class="flex-1 p-2 border rounded"
      />
      <button
        on:click={fetch_user_stats}
        disabled={loading || !handle}
        class="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 hover:bg-blue-600"
      >
        {loading ? 'Loading...' : 'Fetch Stats'}
      </button>
    </div>
  </div>

  {#if error}
    <div class="p-4 bg-red-100 text-red-700 rounded mb-4">
      {error}
    </div>
  {/if}

  {#if user_data}
    <div class="bg-white shadow rounded-lg p-6">
      <div class="flex items-center mb-4">
        {#if user_data.avatar}
          <img
            src={user_data.avatar}
            alt="Profile"
            class="w-16 h-16 rounded-full mr-4"
          />
        {/if}
        <div>
          <h2 class="text-xl font-bold">{user_data.displayName}</h2>
          <p class="text-gray-600">@{user_data.handle}</p>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4 mb-4">
        <div class="bg-gray-50 p-4 rounded">
          <div class="text-2xl font-bold">{user_data.followersCount}</div>
          <div class="text-gray-600">Followers</div>
        </div>
        <div class="bg-gray-50 p-4 rounded">
          <div class="text-2xl font-bold">{user_data.followsCount}</div>
          <div class="text-gray-600">Following</div>
        </div>
        <div class="bg-gray-50 p-4 rounded">
          <div class="text-2xl font-bold">{user_data.postsCount}</div>
          <div class="text-gray-600">Posts</div>
        </div>
      </div>

      {#if user_data.description}
        <p class="text-gray-700 mb-4">{user_data.description}</p>
      {/if}

      <div class="text-sm text-gray-500">
        Last updated: {new Date(user_data.indexedAt).toLocaleString()}
      </div>
    </div>
  {/if}
</div>