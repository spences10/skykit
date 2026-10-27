import { parse } from 'svelte/compiler';
import ts from 'typescript';
import { vendored_ui } from './policy.ts';
import {
	finding,
	walk,
	type Finding,
	type Source,
} from './source.ts';

interface MarkupNode {
	type?: string;
	start?: number;
	test?: MarkupNode;
	consequent?: MarkupNode;
	alternate?: MarkupNode;
}

const rule = 'nested-ternary';
const message =
	'A ternary is one either/or. For more branches use if/return in a function or $derived.by, {#if} blocks in markup, or a lookup object keyed by one value.';

function unwrap(node: ts.Node): ts.Node {
	if (
		ts.isParenthesizedExpression(node) ||
		ts.isAsExpression(node) ||
		ts.isSatisfiesExpression(node) ||
		ts.isNonNullExpression(node)
	)
		return unwrap(node.expression);
	return node;
}

function outer_ternary(node: ts.Node) {
	let parent = node.parent;
	while (parent && unwrap(parent) !== parent) parent = parent.parent;
	return parent && ts.isConditionalExpression(parent);
}

/** A ternary is one either/or; a chain of them hides the branches. */
export function check_ternaries(source: Source): Finding[] {
	if (source.file.startsWith(vendored_ui)) return [];
	const results: Finding[] = [];
	walk(source.ast, (node) => {
		if (!ts.isConditionalExpression(node) || outer_ternary(node))
			return;
		if (
			[node.condition, node.whenTrue, node.whenFalse].some((part) =>
				ts.isConditionalExpression(unwrap(part)),
			)
		)
			results.push(finding(source, node, rule, message));
	});
	return results;
}

/** Template expressions, which parse_source leaves out. */
export function check_markup_ternaries(
	file: string,
	text: string,
): Finding[] {
	if (!file.endsWith('.svelte') || file.startsWith(vendored_ui))
		return [];
	const results: Finding[] = [];
	const visit = (value: unknown, in_ternary: boolean) => {
		if (!value || typeof value !== 'object') return;
		if (Array.isArray(value)) {
			for (const child of value) visit(child, in_ternary);
			return;
		}
		const node = value as MarkupNode;
		const ternary = node.type === 'ConditionalExpression';
		if (
			ternary &&
			!in_ternary &&
			[node.test, node.consequent, node.alternate].some(
				(part) => part?.type === 'ConditionalExpression',
			)
		)
			results.push({
				file,
				line: text.slice(0, node.start).split('\n').length,
				rule,
				message,
			});
		for (const [key, child] of Object.entries(node))
			if (key !== 'metadata') visit(child, ternary);
	};
	visit(parse(text, { modern: true }).fragment, false);
	return results;
}
