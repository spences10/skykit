<script lang="ts">
	import { page } from '$app/state';
	import CircleQuestionMark from '@lucide/svelte/icons/circle-question-mark';
	import House from '@lucide/svelte/icons/house';
	import Search from '@lucide/svelte/icons/search';
	import Snail from '@lucide/svelte/icons/snail';

	const funny_messages = [
		'Oops! Looks like this page took a wrong turn at Albuquerque!',
		'404: User not found. They might be out getting coffee',
		"Houston, we have a problem... This page doesn't exist",
		'Looks like this page is playing hide and seek (and winning)',
		'This page has gone to get milk and may never return',
		'Error 404: Page got lost in the Bluesky!',
		'Whoopsie! This page is on a digital vacation',
		'Page not found - must be chasing butterflies',
	];

	const rate_limit_messages = [
		"Whoa there, speed racer! You're moving too fast!",
		'Time for a quick tea break!',
		"Let's take it easy for a moment!",
		'Too many requests - even ninjas need to rest!',
		'Our hamsters need a breather!',
		"Slow down buttercup, Rome wasn't analysed in a day!",
	];

	const error_message = page.error?.message;
	const is_rate_limited = page.status === 429;

	const random_message = is_rate_limited
		? rate_limit_messages[
				Math.floor(Math.random() * rate_limit_messages.length)
			]
		: funny_messages[
				Math.floor(Math.random() * funny_messages.length)
			];
</script>

<div class="hero min-h-screen bg-base-200">
	<div class="hero-content text-center">
		<div class="max-w-md">
			<div class="mb-8 flex justify-center">
				<div
					class="flex size-32 items-center justify-center rounded-full bg-base-300 text-base-content/70"
				>
					{#if is_rate_limited}
						<Snail class="size-16" aria-hidden="true" />
					{:else if page.status === 404}
						<Search class="size-16" aria-hidden="true" />
					{:else}
						<CircleQuestionMark class="size-16" aria-hidden="true" />
					{/if}
				</div>
			</div>

			<h1 class="mb-4 text-5xl font-bold">
				{#if error_message}
					<span class="text-error">{error_message}</span>
				{:else}
					<span class="text-primary">{page.status}</span>
				{/if}
			</h1>

			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<p class="text-lg">{random_message}</p>
					{#if is_rate_limited}
						<div class="mt-4 alert alert-warning">
							<p>
								The API needs a little break. Try again in a few
								moments!
							</p>
						</div>
					{/if}
					<div class="mt-6 card-actions justify-center">
						<a href="/" class="btn btn-wide gap-2 btn-primary">
							<span>Take Me Home</span>
							<House class="size-5" aria-hidden="true" />
						</a>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
