<script lang="ts">
	import { page } from '$app/state';

	const funny_messages = [
		'Oops! Looks like this page took a wrong turn at Albuquerque! 🗺️',
		'404: User not found. They might be out getting coffee ☕',
		"Houston, we have a problem... This page doesn't exist 🚀",
		'Looks like this page is playing hide and seek (and winning) 🙈',
		'This page has gone to get milk and may never return 🥛',
		'Error 404: Page got lost in the Bluesky! ☁️',
		'Whoopsie! This page is on a digital vacation 🏖️',
		'Page not found - must be chasing butterflies 🦋',
	];

	const rate_limit_messages = [
		"Whoa there, speed racer! You're moving too fast! 🏃‍♂️💨",
		'Time for a quick tea break! ☕',
		"Let's take it easy for a moment! 🧘‍♂️",
		'Too many requests - even ninjas need to rest! 🥷',
		'Our hamsters need a breather! 🐹',
		"Slow down buttercup, Rome wasn't analysed in a day! 🏛️",
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

<div class="hero bg-base-200 min-h-screen">
	<div class="hero-content text-center">
		<div class="max-w-md">
			<div class="mb-8 flex justify-center">
				<div class="avatar placeholder">
					<div class="bg-neutral-focus w-32 rounded-full text-5xl">
						{#if is_rate_limited}
							🐌
						{:else if page.status === 404}
							🔍
						{:else}
							🤔
						{/if}
					</div>
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
						<div class="alert alert-warning mt-4">
							<p>
								The API needs a little break. Try again in a few
								moments! 🎭
							</p>
						</div>
					{/if}
					<div class="card-actions mt-6 justify-center">
						<a href="/" class="btn btn-primary btn-wide gap-2">
							<span>Take Me Home</span>
							<span>🏠</span>
						</a>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
