<script lang="ts">
	import { page } from '$app/stores';

	const funny_messages = [
		'Oops! Looks like this page took a wrong turn at Albuquerque!',
		'404: User not found. They might be out getting coffee ☕',
		"Houston, we have a problem... This page doesn't exist 🚀",
		'Looks like this page is playing hide and seek (and winning)',
		'This page has gone to get milk and may never return 🥛',
	];

	type ErrorStatus = 404 | 400 | 500;
	type ErrorEmojis = {
		[key in ErrorStatus | 'default']: string[];
	};

	const error_emojis: ErrorEmojis = {
		404: ['👻', '🕵️', '🗺️', '🌫️', '❓'],
		400: ['🤔', '😅', '🫠', '🤦', '😵‍💫'],
		500: ['🔥', '💥', '⚡', '🚨', '🎢'],
		default: ['🤖', '👾', '🎮', '🎲', '🎯'],
	};

	const get_random_emoji = () => {
		const status = $page.status as ErrorStatus;
		const emoji_list = error_emojis[status] || error_emojis.default;
		return emoji_list[Math.floor(Math.random() * emoji_list.length)];
	};

	const random_message =
		funny_messages[Math.floor(Math.random() * funny_messages.length)];
	const random_emoji = get_random_emoji();
</script>

<div class="error_container">
	<h1>{$page.status}: {$page.error?.message || random_message}</h1>

	<div class="animation">
		<div class="emoji">
			{random_emoji}
		</div>
	</div>

	<a href="/" class="home_button">Take me home</a>
</div>

<style>
	.error_container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100vh;
		text-align: center;
		padding: 2rem;
	}

	h1 {
		font-size: 2rem;
		margin-bottom: 2rem;
		color: #ff3e00;
	}

	.emoji {
		font-size: 5rem;
		animation: float 3s ease-in-out infinite;
	}

	.home_button {
		margin-top: 2rem;
		padding: 0.8rem 1.5rem;
		background-color: #ff3e00;
		color: white;
		border-radius: 8px;
		text-decoration: none;
		transition: transform 0.2s;
	}

	.home_button:hover {
		transform: scale(1.05);
	}

	@keyframes float {
		0% {
			transform: translateY(0px);
		}
		50% {
			transform: translateY(-20px);
		}
		100% {
			transform: translateY(0px);
		}
	}
</style>
