<script lang="ts">
	import {
		search_handles,
		type HandleSuggestion,
	} from '#lib/handle-search.remote.js';
	import { goto } from '$app/navigation';
	import Search from '@lucide/svelte/icons/search';

	const debounce_ms = 200;
	const listbox_id = 'handle-suggestions';

	let text = $state('');
	let loading = $state(false);
	let suggestions = $state<HandleSuggestion[]>([]);
	let open = $state(false);
	let active_index = $state(-1);

	let timer: ReturnType<typeof setTimeout> | undefined;
	// Only the latest request may fill the list
	let request_id = 0;

	const to_handle = (value: string) =>
		value.replace(/\s+/g, '').replace(/^@/, '');

	const show_list = $derived(open && suggestions.length > 0);

	async function load_suggestions(value: string) {
		const id = ++request_id;
		try {
			const result = await search_handles(value);
			if (id !== request_id) return;
			suggestions = result;
			active_index = -1;
		} catch {
			// A failed lookup only means no suggestions
			if (id === request_id) suggestions = [];
		}
	}

	function handle_input(event: Event) {
		text = (event.target as HTMLInputElement).value;
		open = true;
		clearTimeout(timer);
		const value = text.trim().replace(/^@/, '');
		if (value.length < 2) {
			request_id++;
			suggestions = [];
			return;
		}
		timer = setTimeout(() => load_suggestions(value), debounce_ms);
	}

	async function go_to(handle: string) {
		if (!handle) return;
		clearTimeout(timer);
		open = false;
		loading = true;
		await goto(`/${handle}`);
		loading = false;
	}

	function handle_keydown(event: KeyboardEvent) {
		if (event.key === 'ArrowDown' && suggestions.length > 0) {
			event.preventDefault();
			open = true;
			active_index = (active_index + 1) % suggestions.length;
		} else if (event.key === 'ArrowUp' && suggestions.length > 0) {
			event.preventDefault();
			open = true;
			active_index =
				active_index <= 0 ? suggestions.length - 1 : active_index - 1;
		} else if (event.key === 'Escape') {
			open = false;
			active_index = -1;
		} else if (event.key === 'Enter' && !loading) {
			event.preventDefault();
			const chosen = show_list
				? suggestions[active_index]
				: undefined;
			go_to(chosen?.handle ?? to_handle(text));
		}
	}
</script>

<div class="relative">
	<div class="join w-full">
		<input
			type="text"
			role="combobox"
			aria-label="Bluesky handle"
			aria-autocomplete="list"
			aria-controls={listbox_id}
			aria-expanded={show_list}
			aria-activedescendant={show_list && active_index >= 0
				? `${listbox_id}-${active_index}`
				: undefined}
			value={text}
			oninput={handle_input}
			onkeydown={handle_keydown}
			onfocus={() => (open = true)}
			onblur={() => (open = false)}
			autocomplete="off"
			autocorrect="off"
			autocapitalize="off"
			spellcheck="false"
			placeholder="Enter handle (e.g. alice.bsky.social)"
			class="input join-item flex-1 focus:outline-none"
		/>
		<button
			onclick={() => go_to(to_handle(text))}
			disabled={loading || !to_handle(text)}
			class="btn join-item btn-primary"
		>
			{#if loading}
				<span class="loading loading-spinner" aria-hidden="true"
				></span>
			{:else}
				<Search class="h-5 w-5" aria-hidden="true" />
			{/if}
			<span class="ml-2">Search</span>
		</button>
	</div>

	<ul
		id={listbox_id}
		role="listbox"
		aria-label="Matching Bluesky accounts"
		class="absolute z-10 mt-1 w-full overflow-hidden rounded-box border border-base-300 bg-base-100 shadow-lg"
		hidden={!show_list}
	>
		{#each suggestions as suggestion, index (suggestion.did)}
			<!-- Keys go to the combobox input, which points here with aria-activedescendant -->
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<li
				id="{listbox_id}-{index}"
				role="option"
				aria-selected={index === active_index}
				class="flex cursor-pointer items-center gap-3 px-3 py-2 {index ===
				active_index
					? 'bg-base-200'
					: ''}"
				onmousedown={(event) => event.preventDefault()}
				onclick={() => go_to(suggestion.handle)}
				onmouseenter={() => (active_index = index)}
			>
				{#if suggestion.avatar}
					<img
						src={suggestion.avatar}
						alt=""
						class="size-8 shrink-0 rounded-full"
						loading="lazy"
					/>
				{:else}
					<span
						class="size-8 shrink-0 rounded-full bg-base-300"
						aria-hidden="true"
					></span>
				{/if}
				<span class="min-w-0">
					{#if suggestion.display_name}
						<span class="block truncate font-medium">
							{suggestion.display_name}
						</span>
					{/if}
					<span class="block truncate text-sm text-base-content/60">
						@{suggestion.handle}
					</span>
				</span>
			</li>
		{/each}
	</ul>
</div>
