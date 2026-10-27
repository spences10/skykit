import ts from 'typescript';
import { vendored_ui } from './policy.ts';
import {
	finding,
	walk,
	type Finding,
	type Source,
} from './source.ts';

// Reading effect status is fine; creating an effect is not.
const effect_queries = new Set(['tracking', 'pending']);

/**
 * $effect is an escape hatch, and models reach for it to sync state.
 * App code derives state, reacts in handlers and sets up DOM work in
 * attachments instead.
 */
export function check_effects(source: Source): Finding[] {
	if (
		!source.file.startsWith('src/') ||
		source.file.startsWith(vendored_ui)
	)
		return [];
	const results: Finding[] = [];
	walk(source.ast, (node) => {
		if (!ts.isIdentifier(node) || node.text !== '$effect') return;
		const parent = node.parent;
		if (ts.isPropertyAccessExpression(parent)) {
			if (parent.name === node) return;
			if (effect_queries.has(parent.name.text)) return;
		}
		results.push(
			finding(
				source,
				node,
				'no-effect',
				'Do not use $effect: derive state with $derived, update it in event handlers, and set up DOM or library work with {@attach} or onMount.',
			),
		);
	});
	return results;
}
