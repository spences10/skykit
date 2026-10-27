import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parse_source } from './source.ts';
import {
	check_markup_ternaries,
	check_ternaries,
} from './ternaries.ts';

const module = 'packages/core/src/example.ts';
const component = 'src/lib/components/example.svelte';

function lines(text: string, file = module) {
	return check_ternaries(parse_source(file, text)).map(
		(finding) => finding.line,
	);
}

function markup_lines(text: string, file = component) {
	return check_markup_ternaries(file, text).map(
		(finding) => finding.line,
	);
}

await test('rejects a ternary inside a ternary, once per chain', () => {
	for (const text of [
		'const a = b ? 1 : c ? 2 : 3;',
		'const a = b ? (c ? 1 : 2) : 3;',
		'const a = (b ? c : d) ? 1 : 2;',
		'const a = b ? 1 : c ? 2 : d ? 3 : 4;',
		'const a = b ? 1 : (c ? 2 : 3) as const;',
	])
		assert.deepEqual(lines(text), [1], text);
	assert.deepEqual(
		lines(
			'<script lang="ts">\nconst a = b ? 1 : c ? 2 : 3;</script>',
			component,
		),
		[2],
	);
});

await test('allows single ternaries, including ones nested in other expressions', () => {
	for (const text of [
		'const a = b ? 1 : 2;',
		'const a = b ? `${c ? "x" : "y"}` : "z";',
		'const a = b ? f(c ? 1 : 2) : 3;',
		'const a = b ? 1 : 2; const d = e ? 3 : 4;',
	])
		assert.deepEqual(lines(text), [], text);
});

await test('checks template expressions in components', () => {
	assert.deepEqual(markup_lines('<p>\n{a ? 1 : b ? 2 : 3}</p>'), [2]);
	assert.deepEqual(
		markup_lines('<Hint text={a ? "x" : (b ? "y" : "z")} />'),
		[1],
	);
	assert.deepEqual(markup_lines('<p>{a ? 1 : 2}</p>'), []);
	assert.deepEqual(
		markup_lines(
			'<script>const a = b ? 1 : c ? 2 : 3;</script><p></p>',
		),
		[],
	);
});

await test('leaves vendored primitives alone', () => {
	const file = 'src/lib/components/ui/carousel/carousel.svelte';
	assert.deepEqual(
		markup_lines('<p>{a ? 1 : b ? 2 : 3}</p>', file),
		[],
	);
	assert.deepEqual(
		lines('<script>const a = b ? 1 : c ? 2 : 3;</script>', file),
		[],
	);
});
