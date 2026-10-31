<script lang="ts">
	import Inbox from '@lucide/svelte/icons/inbox';

	const { text }: { text: string } = $props();
</script>

<div class="card bg-base-200 shadow-lg">
	<div class="card-body p-6 text-center">
		<div class="flex flex-col items-center gap-4">
			<Inbox
				class="size-12 text-base-content/60"
				aria-hidden="true"
			/>
			<p class="text-lg font-medium text-base-content/80">
				{text}
			</p>
		</div>
	</div>
</div>
