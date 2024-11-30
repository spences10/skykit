<script lang="ts">
	const { text } = $props<{ text: string }>();
</script>

<div class="card bg-base-200 shadow-lg">
	<div class="card-body p-6 text-center">
		<div class="flex flex-col items-center gap-4">
			<div class="text-5xl">🦋</div>
			<p class="text-lg font-medium text-base-content/80">
				{text}
			</p>
		</div>
	</div>
</div>
