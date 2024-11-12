<script lang="ts">
	import { Heart } from '$lib/icons';
</script>

<footer class="py-8">
	<div class="container mx-auto max-w-4xl px-4">
		<div
			class="mt-8 flex flex-col items-center justify-center gap-2 border-t border-base-300 pt-8 text-center text-sm text-base-content/60"
		>
			<p class="flex items-center gap-2">
				Made with <Heart
					class_names="h-4 w-4 text-primary fill-current hover:text-secondary"
				/> by
				<a
					href="https://scottspence.com"
					target="_blank"
					rel="noopener noreferrer"
					class="link-hover link link-primary"
				>
					Scott Spence
				</a>
			</p>
			<p>
				© {new Date().getFullYear()} SkyKit.
			</p>
		</div>
	</div>
</footer>
