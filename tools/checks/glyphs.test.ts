import assert from 'node:assert/strict';
import { test } from 'node:test';
import { check_glyphs } from './glyphs.ts';
import { parse_source } from './source.ts';

const component = 'src/lib/components/example.svelte';

function glyphs(text: string, file = component) {
	return check_glyphs(parse_source(file, text), text).map(
		(finding) => finding.rule,
	);
}

for (const text of [
	'<a href="/">← Back to Profile</a>',
	'<p>✓ Experience added</p>',
	'<li>• TypeScript</li>',
	'<p>↓ reworded</p>',
	'<p>Next -> Done</p>',
	'<p>Done ⭐</p>',
	'<Kbd>{shortcut("↵")}</Kbd>',
	'<Button aria-label="Next →" />',
	"<script>const steps = ['Submitted → Screen'];</script>",
	'<p>Text</p><style>li::before { content: "→"; }</style>',
])
	await test(`rejects a text glyph: ${text}`, () => {
		assert.deepEqual(glyphs(text), ['icon-glyph']);
	});

await test('rejects glyphs in web TypeScript', () => {
	assert.deepEqual(
		glyphs(
			'export const label = "See more →";',
			'src/routes/workspace/steps.ts',
		),
		['icon-glyph'],
	);
});

await test('allows typography, icons, code and comments', () => {
	for (const text of [
		'<p>v2 · 20 Oct — approved… it’s live</p>',
		'<Kbd>⌘K</Kbd>',
		'<CheckIcon /> Approved',
		'<!-- a → b --><p>Ok</p>',
		'<div class="[&>svg]:size-4 *:p-2">Ok</div>',
		'<script>const pick = (a) => a; // a → b</script>',
		'<p>a=>b and x->y</p>',
	])
		assert.deepEqual(glyphs(text), [], text);
});

await test('leaves vendored primitives, server code and tests alone', () => {
	const text = 'export const bull = "•";';
	for (const file of [
		'src/lib/components/ui/thing/thing.svelte',
		'src/lib/server/activity/repo-activity.ts',
		'src/lib/components/jobs/advert-view.svelte.spec.ts',
		'src/lib/components/jobs/data.test-fixture.ts',
		'tools/checks/example.ts',
	])
		assert.deepEqual(glyphs(text, file), [], file);
});
