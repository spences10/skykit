<script lang="ts">
	import { Footer } from '#lib/components/index.js';
	import { browser } from '$app/env';
	import {
		PUBLIC_FATHOM_ID,
		PUBLIC_FATHOM_URL,
	} from '$app/env/public';
	import { page } from '$app/state';
	import * as Fathom from 'fathom-client';
	import '../app.css';

	let { children } = $props();

	$effect(() => {
		if (browser) {
			Fathom.load(PUBLIC_FATHOM_ID, {
				url: PUBLIC_FATHOM_URL,
			});
		}
	});

	// Track pageview on route change
	$effect(() => {
		(page.url.pathname, browser && Fathom.trackPageview());
	});
</script>

<div class="flex min-h-screen flex-col">
	<main class="flex-1">
		{@render children?.()}
	</main>
	<Footer />
</div>
