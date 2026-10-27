<script lang="ts">
	import { Footer } from '#lib/components/index.js';
	import {
		PUBLIC_FATHOM_ID,
		PUBLIC_FATHOM_URL,
	} from '$app/env/public';
	import { afterNavigate } from '$app/navigation';
	import * as Fathom from 'fathom-client';
	import { onMount } from 'svelte';
	import '../app.css';

	let { children } = $props();

	onMount(() => {
		Fathom.load(PUBLIC_FATHOM_ID, {
			url: PUBLIC_FATHOM_URL,
		});
	});

	// Track pageview on every navigation, including the first load
	afterNavigate(() => {
		Fathom.trackPageview();
	});
</script>

<div class="flex min-h-screen flex-col">
	<main class="flex-1">
		{@render children?.()}
	</main>
	<Footer />
</div>
