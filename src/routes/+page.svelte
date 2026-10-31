<script lang="ts">
	import { LandingDetails } from '#lib/components/index.js';
	import {
		create_seo_config,
		home_schema,
		site_description,
	} from '#lib/seo.js';
	import { goto } from '$app/navigation';
	import Search from '@lucide/svelte/icons/search';
	import { Head, SchemaOrg } from 'svead';

	let handle = $state('');
	let loading = $state(false);

	const clean_handle = (value: string) => {
		return value.replace(/\s+/g, '').trim();
	};

	const handle_input = (e: Event) => {
		const input = e.target as HTMLInputElement;
		const cleaned = clean_handle(input.value);
		handle = cleaned;
		// Set cursor position to end of input
		input.value = cleaned;
		input.selectionStart = cleaned.length;
		input.selectionEnd = cleaned.length;
	};

	const handle_search = async () => {
		if (!handle) return;
		loading = true;
		const cleaned_handle = handle.startsWith('@')
			? handle.slice(1)
			: handle;
		await goto(`/${cleaned_handle}`);
		loading = false;
	};

	const handle_keydown = (e: KeyboardEvent) => {
		if (e.key === 'Enter' && !loading && handle) {
			handle_search();
		}
	};

	const seo_config = create_seo_config({
		title: 'SkyKit · Free Bluesky analytics, no sign-in',
		description: site_description,
	});
</script>

<Head {seo_config} />
<SchemaOrg schema={home_schema()} />

<div class="container mx-auto max-w-2xl p-4 pt-20">
	<div class="mb-12 text-center">
		<h1
			class="mb-4 bg-linear-to-r from-primary to-secondary bg-clip-text text-5xl leading-normal font-extrabold text-transparent"
		>
			SkyKit
		</h1>
		<p class="text-lg text-base-content/70">
			Free Bluesky analytics for any handle
		</p>
	</div>

	<div class="card bg-base-100 shadow-xl">
		<div class="card-body">
			<div class="join w-full">
				<input
					type="text"
					value={handle}
					oninput={handle_input}
					onkeydown={handle_keydown}
					autocomplete="off"
					autocorrect="off"
					autocapitalize="off"
					spellcheck="false"
					placeholder="Enter handle (e.g. alice.bsky.social)"
					class="input join-item flex-1 focus:outline-none"
				/>
				<button
					onclick={handle_search}
					disabled={loading || !handle}
					class="btn join-item btn-primary"
				>
					{#if loading}
						<span class="loading loading-spinner"></span>
					{:else}
						<Search class="h-5 w-5" />
					{/if}
					<span class="ml-2">
						{loading ? null : 'Search'}
					</span>
				</button>
			</div>
			<p class="text-sm text-base-content/60">
				No sign-in, no app password. Just a handle.
			</p>
		</div>
	</div>

	<LandingDetails />
</div>
