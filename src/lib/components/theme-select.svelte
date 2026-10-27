<script lang="ts">
	import { themes } from '#lib/themes/index.js';
	import { browser } from '$app/env';

	// hooks.server.ts already applied the theme cookie to <html>
	let current_theme = $state(
		browser
			? (document.documentElement.getAttribute('data-theme') ?? '')
			: '',
	);

	const set_theme = (event: Event) => {
		const select = event.target as HTMLSelectElement;
		const theme = select.value;
		if (themes.includes(theme)) {
			const one_year = 60 * 60 * 24 * 365;
			window.localStorage.setItem('theme', theme);
			document.cookie = `theme=${theme}; max-age=${one_year}; path=/; SameSite=Lax`;
			document.documentElement.setAttribute('data-theme', theme);
			current_theme = theme;
		}
	};
</script>

<select
	bind:value={current_theme}
	data-choose-theme
	class="select-bordered select w-full"
	onchange={set_theme}
>
	<option value="" disabled={current_theme !== ''}>Theme</option>
	{#each themes as theme}
		<option value={theme} class="capitalize">{theme}</option>
	{/each}
</select>
