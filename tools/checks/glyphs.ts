import { parse } from 'svelte/compiler';
import { vendored_ui } from './policy.ts';
import type { Finding, Source } from './source.ts';
import {
	line_of,
	script_strings,
	svelte_strings,
} from './strings.ts';

interface MarkupNode {
	type?: string;
	name?: string;
	start?: number;
	end?: number;
	data?: string;
	attributes?: MarkupNode[];
}

// Arrows, bullets, ticks, crosses, shapes, box drawing and emoji, plus
// spaced ASCII arrows. Typography (· — – … ’ ⌘) is fine.
const glyph =
	/[•‣⁃←-⇿─-◿☀-➿⟰-⟿⤀-⥿⬀-⯿\u{1f300}-\u{1faff}]|(?:^|\s)(?:-+>|<-+|=>)(?=\s|$)/u;
// Plain-text contexts where a font cannot apply.
const unstyled = new Set(['title', 'code', 'kbd', 'svelte:head']);

function in_scope(file: string) {
	return (
		file.startsWith('src/') &&
		!file.startsWith(vendored_ui) &&
		/\.(?:svelte|ts)$/.test(file)
	);
}

// Prose between tags; attribute and expression strings come from colours.ts.
function markup_text(
	text: string,
	callback: (node: MarkupNode, mono: boolean) => void,
) {
	const visit = (value: unknown, mono: boolean) => {
		if (!value || typeof value !== 'object') return;
		if (Array.isArray(value)) {
			for (const child of value) visit(child, mono);
			return;
		}
		const node = value as MarkupNode;
		if (node.type === 'Text') {
			const data = node.data ?? '';
			// Report the line of the words, not the whitespace before them.
			const start =
				(node.start ?? 0) + data.length - data.trimStart().length;
			callback({ ...node, start }, mono);
		}
		const plain =
			unstyled.has(node.name ?? '') ||
			node.attributes?.some(
				(attribute) =>
					(attribute.type === 'Attribute' &&
						attribute.name === 'class' &&
						/(?<![\w-])font-mono(?![\w-])/.test(
							text.slice(attribute.start, attribute.end),
						)) ||
					(attribute.type === 'ClassDirective' &&
						attribute.name === 'font-mono'),
			);
		for (const [key, child] of Object.entries(value))
			if (key !== 'parent' && key !== 'attributes')
				visit(child, mono || Boolean(plain));
	};
	visit(parse(text, { modern: true }).fragment, false);
}

/**
 * Text glyphs standing in for icons read as placeholder UI; markup uses
 * Lucide icons, and plain text says it in words.
 */
export function check_glyphs(
	source: Source,
	text: string,
): Finding[] {
	const { file } = source;
	if (
		!in_scope(file) ||
		file.startsWith('src/lib/server/') ||
		/\.(?:test|spec|test-fixture)\.ts$/.test(file)
	)
		return [];
	const strings: { offset?: number; value: string }[] = [];
	if (file.endsWith('.svelte')) {
		strings.push(...svelte_strings(text));
		markup_text(text, (node) =>
			strings.push({ offset: node.start, value: node.data ?? '' }),
		);
	} else strings.push(...script_strings(source));
	return strings
		.filter(({ value }) => glyph.test(value))
		.map(({ offset }) => ({
			file,
			line: line_of(text, offset),
			rule: 'icon-glyph',
			message:
				'Use a Lucide icon (@lucide/svelte/icons/…) or words, not a text glyph such as → ✓ •.',
		}));
}
