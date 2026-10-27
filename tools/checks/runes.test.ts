import assert from 'node:assert/strict';
import { test } from 'node:test';
import { check_effects } from './runes.ts';
import { parse_source } from './source.ts';

const component = 'src/lib/components/example.svelte';

function rules(text: string, file = component) {
	return check_effects(parse_source(file, text)).map(
		(finding) => finding.rule,
	);
}

await test('rejects every way of creating an effect in app code', () => {
	for (const script of [
		'$effect(() => { count += 1; });',
		'$effect.pre(() => {});',
		'const stop = $effect.root(() => {});',
		'const run = $effect; run(() => {});',
	])
		assert.deepEqual(
			rules(`<script lang="ts">${script}</script>`),
			['no-effect'],
			script,
		);
	assert.deepEqual(
		rules(
			'export const tick = () => $effect(() => {});',
			'src/lib/client/state.svelte.ts',
		),
		['no-effect'],
	);
});

await test('allows effect status queries, markup text and unrelated names', () => {
	for (const text of [
		'<script>const tracked = $effect.tracking();</script>',
		'<script>const waiting = $effect.pending();</script>',
		'<script>const label = "$effect"; state.$effect = 1;</script>',
		'<!-- <script>$effect(() => {});</script> --><p>$effect</p>',
	])
		assert.deepEqual(rules(text), [], text);
});

await test('leaves vendored primitives and other workspaces alone', () => {
	const text = '<script>$effect(() => {});</script>';
	assert.deepEqual(
		rules(text, 'src/lib/components/ui/carousel/carousel.svelte'),
		[],
	);
	assert.deepEqual(
		rules(text, 'packages/core/src/example.svelte'),
		[],
	);
});
