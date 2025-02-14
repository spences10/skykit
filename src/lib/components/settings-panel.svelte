<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import { Chevron } from '$lib/icons';
	import { visibility_state } from '$lib/visibility.svelte';
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
		if (browser) {
			visibility_state.load_sections(handle);
		}
	});

	const handle_change = (id: string, event: Event) => {
		const checked = (event.target as HTMLInputElement).checked;
		const handle = page.params.handle;
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

<div class="mb-6">
	<button
		class="btn btn-ghost btn-sm gap-2"
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
		<div
			class="card bg-base-200 mt-2"
			transition:slide={{ duration: 300 }}
		>
			<div class="card-body">
				<h3 class="card-title text-sm">Visible Sections</h3>
				<div class="form-control">
					{#each sections as { id, label }}
						<label class="label cursor-pointer">
							<span class="label-text">{label}</span>
							<input
								type="checkbox"
								class="checkbox"
								checked={visibility_state.sections.includes(id)}
								onchange={(e) => handle_change(id, e)}
							/>
						</label>
					{/each}
				</div>

				<div class="divider"></div>

				<h3 class="card-title text-sm">Theme</h3>
				<ThemeSelect />
			</div>
		</div>
	{/if}
</div>
