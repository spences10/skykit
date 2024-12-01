import typography from '@tailwindcss/typography';
import daisyui from 'daisyui';
import type { Config } from 'tailwindcss';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {},
	},

	safelist: [
		'tooltip',
		'tooltip-top',
		'tooltip-bottom',
		'tooltip-left',
		'tooltip-right',
		'tooltip-primary',
		'tooltip-secondary',
		'tooltip-accent',
		'tooltip-info',
		'tooltip-success',
		'tooltip-warning',
		'tooltip-error'
	],

	plugins: [typography, daisyui],

	daisyui: {
		themes: true,
		logs: false,
	},
} satisfies Config;
