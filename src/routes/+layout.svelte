<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/stores';
	import {
		PUBLIC_FATHOM_ID,
		PUBLIC_FATHOM_URL,
	} from '$env/static/public';
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
		$page.url.pathname, browser && Fathom.trackPageview();
	});
</script>

<main>
	{@render children?.()}
</main>
