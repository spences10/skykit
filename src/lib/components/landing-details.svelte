<script lang="ts">
	import { features, steps } from '#lib/landing.js';
	import Activity from '@lucide/svelte/icons/activity';
	import ChartPie from '@lucide/svelte/icons/chart-pie';
	import Clock from '@lucide/svelte/icons/clock';
	import Globe from '@lucide/svelte/icons/globe';
	import KeyRound from '@lucide/svelte/icons/key-round';
	import Lightbulb from '@lucide/svelte/icons/lightbulb';
	import UserRoundX from '@lucide/svelte/icons/user-round-x';
	import UserX from '@lucide/svelte/icons/user-x';
	import Users from '@lucide/svelte/icons/users';

	const no_friction = [
		{
			icon: UserRoundX,
			title: 'No account',
			text: 'Nothing to sign up for. Type a handle and go.',
		},
		{
			icon: KeyRound,
			title: 'No app password',
			text: 'SkyKit never asks for your Bluesky login.',
		},
		{
			icon: Globe,
			title: 'Public data only',
			text: "It reads the same public Bluesky data anyone's feed shows.",
		},
	];

	const icons = [Activity, Clock, ChartPie, Users, Lightbulb, UserX];
</script>

<section aria-labelledby="no-friction" class="mt-10">
	<h2 id="no-friction" class="sr-only">No sign-in needed</h2>
	<ul class="grid gap-4 sm:grid-cols-3">
		{#each no_friction as item (item.title)}
			<li class="flex flex-col items-center gap-1 text-center">
				<item.icon class="size-6 text-primary" aria-hidden="true" />
				<span class="font-semibold">{item.title}</span>
				<span class="text-sm text-base-content/70">{item.text}</span>
			</li>
		{/each}
	</ul>
</section>

<section aria-labelledby="what-you-get" class="mt-16">
	<h2 id="what-you-get" class="mb-6 text-center text-2xl font-bold">
		What you get
	</h2>
	<ul class="grid gap-4 sm:grid-cols-2">
		{#each features as feature, index (feature.title)}
			{@const Icon = icons[index]}
			<li class="card bg-base-200">
				<div class="card-body gap-2 p-5">
					<h3 class="flex items-center gap-2 font-semibold">
						<Icon class="size-5 text-primary" aria-hidden="true" />
						{feature.title}
					</h3>
					<p class="text-sm text-base-content/70">{feature.text}</p>
				</div>
			</li>
		{/each}
	</ul>
</section>

<section aria-labelledby="how-it-works" class="mt-16 mb-8">
	<h2 id="how-it-works" class="mb-6 text-center text-2xl font-bold">
		How it works
	</h2>
	<ol class="space-y-4">
		{#each steps as step, index (step)}
			<li class="flex items-start gap-4">
				<span
					class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-content"
				>
					{index + 1}
				</span>
				<span class="pt-1">{step}</span>
			</li>
		{/each}
	</ol>
</section>
