import { parse } from 'svelte/compiler';
import ts from 'typescript';
import { walk, type Source } from './source.ts';

interface MarkupNode {
	type?: string;
	start?: number;
	value?: unknown;
	data?: string;
	raw?: string;
}

export function line_of(text: string, offset = 0) {
	return text.slice(0, offset).split('\n').length;
}

// Strings in markup attributes and script/template expressions, not prose.
export function svelte_strings(text: string) {
	const ast = parse(text, { modern: true });
	const strings: { offset?: number; value: string }[] = [];
	const visit = (value: unknown) => {
		if (!value || typeof value !== 'object') return;
		if (Array.isArray(value)) {
			for (const child of value) visit(child);
			return;
		}
		const node = value as MarkupNode;
		if (node.type === 'Literal' && typeof node.value === 'string')
			strings.push({ offset: node.start, value: node.value });
		if (node.type === 'TemplateElement')
			strings.push({
				offset: node.start,
				value: (node.value as { raw: string }).raw,
			});
		if (node.type === 'Attribute' && Array.isArray(node.value))
			for (const part of node.value as MarkupNode[])
				if (part.type === 'Text')
					strings.push({
						offset: part.start,
						value: part.data ?? '',
					});
		for (const [key, child] of Object.entries(value))
			if (key !== 'parent') visit(child);
	};
	visit([ast.fragment, ast.instance, ast.module]);
	if (ast.css)
		strings.push({
			offset: ast.css.start,
			value: ast.css.content.styles,
		});
	return strings;
}

export function script_strings(source: Source) {
	const strings: { offset?: number; value: string }[] = [];
	walk(source.ast, (node) => {
		if (
			ts.isStringLiteralLike(node) ||
			ts.isTemplateHead(node) ||
			ts.isTemplateMiddle(node) ||
			ts.isTemplateTail(node)
		)
			strings.push({
				offset: node.getStart(source.ast),
				value: node.text,
			});
	});
	return strings;
}
