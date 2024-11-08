<script lang="ts">
	interface Props {
		height?: string;
		width?: string;
		class_names?: string;
	}

	let {
		height = '24px',
		width = '24px',
		class_names,
	}: Props = $props();
</script>

<svg
	{height}
	{width}
	class={class_names}
	fill="none"
	viewBox="0 0 24 24"
	stroke="currentColor"
>
	<path
		stroke-linecap="round"
		stroke-linejoin="round"
		stroke-width="2"
		d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
	/>
</svg>
