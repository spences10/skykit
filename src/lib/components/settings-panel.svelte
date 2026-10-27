<script lang="ts">
	import { Chevron } from '#lib/icons/index.js';
	import { visibility_state } from '#lib/visibility.svelte.js';
	import { browser } from '$app/env';
	import { page } from '$app/state';
	import { slide } from 'svelte/transition';
	import ThemeSelect from './theme-select.svelte';

	// Define the sections that can be toggled
	const sections = [
		{ id: 'engagement', label: 'Engagement Stats' },
		{ id: 'content', label: 'Content Analysis' },
		{ id: 'temporal', label: 'Posting Patterns' },
		{ id: 'network', label: 'Network Analysis' },
		{ id: 'insights', label: 'Account Insights' },
	];

	// State management
	let is_open = $state(false);

	// Load settings from localStorage on mount
	$effect(() => {
		const handle = page.params.handle;
		if (browser && handle) {
			visibility_state.load_sections(handle);
		}
	});

	const handle_change = (id: string, event: Event) => {
		const checked = (event.target as HTMLInputElement).checked;
		const handle = page.params.handle;
		if (!handle) return;
		const current_sections = visibility_state.sections;

		if (checked && !current_sections.includes(id)) {
			visibility_state.update_sections(handle, [
				...current_sections,
				id,
			]);
		} else if (!checked && current_sections.includes(id)) {
			visibility_state.update_sections(
				handle,
				current_sections.filter((s) => s !== id),
			);
		}
	};
</script>

<fieldset class="mb-6">
	<button
		class="btn gap-2 btn-ghost btn-sm"
		onclick={() => (is_open = !is_open)}
		aria-expanded={is_open}
	>
		Settings
		<Chevron
			class_names="h-4 w-4 transition-transform {is_open
				? 'rotate-180'
				: ''}"
		/>
	</button>

	{#if is_open}
		<fieldset
			class="card mt-2 bg-base-200"
			transition:slide={{ duration: 300 }}
		>
			<fieldset class="card-body">
				<h3 class="card-title text-sm">Visible Sections</h3>
				<fieldset>
					{#each sections as { id, label }}
						<label class="cursor-pointer">
							<span class="label-text mr-2">{label}</span>
							<input
								type="checkbox"
								class="checkbox"
								checked={visibility_state.sections.includes(id)}
								onchange={(e) => handle_change(id, e)}
							/>
						</label>
					{/each}
				</fieldset>

				<div class="divider"></div>

				<h3 class="card-title text-sm">Theme</h3>
				<ThemeSelect />
			</fieldset>
		</fieldset>
	{/if}
</fieldset>
