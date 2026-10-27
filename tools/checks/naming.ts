import ts from 'typescript';
import { external_property_names, vendored_ui } from './policy.ts';
import {
	finding,
	type Finding,
	type Source,
	walk,
} from './source.ts';

const snake_case = /^\$?[a-z_][a-z0-9_]*$/;
const pascal_case = /^[A-Z][A-Za-z0-9]*$/;
const snake = (name: string) =>
	name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
const owned_module = (specifier: string) =>
	specifier.startsWith('.') || specifier.startsWith('#lib');

/** Check identifiers and owned property declarations, not object-literal keys or third-party API members. */
export function check_naming(source: Source): Finding[] {
	const results: Finding[] = [];
	// Vendored primitives keep upstream names; app code imports them unchanged.
	if (source.file.startsWith(vendored_ui)) return results;
	const report = (node: ts.Node, message: string) =>
		results.push(finding(source, node, 'naming', message));
	const framework_handler = (name: string) =>
		source.file.endsWith('/+server.ts') &&
		/^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS|fallback)$/.test(name);
	const binding = (name: ts.BindingName) => {
		if (ts.isIdentifier(name)) {
			if (
				!snake_case.test(name.text) &&
				!framework_handler(name.text)
			)
				report(
					name,
					'Application-owned variables and functions use snake_case. Preserve contract keys with an explicit local binding.',
				);
		} else {
			for (const element of name.elements)
				if (ts.isBindingElement(element)) binding(element.name);
		}
	};
	walk(source.ast, (node) => {
		// Owned type/class members; object-literal keys often feed library APIs.
		if (
			(ts.isPropertySignature(node) ||
				ts.isMethodSignature(node) ||
				ts.isPropertyDeclaration(node) ||
				(ts.isMethodDeclaration(node) &&
					ts.isClassLike(node.parent))) &&
			(ts.isIdentifier(node.name) ||
				ts.isPrivateIdentifier(node.name))
		) {
			const name = node.name.text.replace(/^#/, '');
			if (
				!snake_case.test(name) &&
				!external_property_names.has(name)
			)
				report(
					node.name,
					`Application-owned property names use snake_case (${name}). Allowlist external contract keys in policy.`,
				);
		}
		if (ts.isVariableDeclaration(node) || ts.isParameter(node))
			binding(node.name);
		if (
			(ts.isFunctionDeclaration(node) ||
				ts.isFunctionExpression(node)) &&
			node.name
		)
			binding(node.name);
		if (
			ts.isInterfaceDeclaration(node) ||
			ts.isTypeAliasDeclaration(node) ||
			ts.isClassDeclaration(node)
		) {
			if (node.name && !pascal_case.test(node.name.text))
				report(
					node.name,
					'Interfaces, type aliases and classes use PascalCase.',
				);
		}
		if (
			ts.isImportDeclaration(node) &&
			ts.isStringLiteral(node.moduleSpecifier)
		) {
			const specifier = node.moduleSpecifier.text;
			const owned = owned_module(specifier);
			const imports = node.importClause?.namedBindings;
			for (const name of [
				node.importClause?.name,
				imports && ts.isNamespaceImport(imports)
					? imports.name
					: undefined,
			]) {
				if (
					name &&
					!snake_case.test(name.text) &&
					!pascal_case.test(name.text)
				)
					report(
						name,
						'Locally chosen default/namespace import names use snake_case (PascalCase for components).',
					);
			}
			if (imports && ts.isNamedImports(imports))
				for (const imported of imports.elements) {
					if (owned)
						for (const name of [
							imported.propertyName,
							imported.name,
						]) {
							if (
								name &&
								!snake_case.test(name.text) &&
								!pascal_case.test(name.text) &&
								!framework_handler(name.text)
							)
								report(
									name,
									'Application-owned imports use their snake_case definitions, not camelCase compatibility aliases.',
								);
						}
					if (
						!owned &&
						imported.propertyName &&
						imported.name.text !== imported.propertyName.text &&
						imported.name.text === snake(imported.propertyName.text)
					)
						report(
							imported.name,
							'Keep third-party export names unchanged; do not snake_case aliases for library APIs.',
						);
				}
		}
		if (
			ts.isExportDeclaration(node) &&
			node.exportClause &&
			ts.isNamedExports(node.exportClause)
		) {
			const external =
				node.moduleSpecifier &&
				ts.isStringLiteral(node.moduleSpecifier) &&
				!owned_module(node.moduleSpecifier.text);
			for (const exported of node.exportClause.elements) {
				if (external) {
					if (
						exported.propertyName &&
						exported.name.text !== exported.propertyName.text &&
						exported.name.text === snake(exported.propertyName.text)
					)
						report(
							exported.name,
							'Keep third-party export names unchanged; do not snake_case aliases for library APIs.',
						);
					continue;
				}
				for (const name of [exported.propertyName, exported.name]) {
					if (
						name &&
						!snake_case.test(name.text) &&
						!pascal_case.test(name.text) &&
						!framework_handler(name.text)
					)
						report(
							name,
							'Application-owned exports use snake_case (PascalCase for types/components).',
						);
				}
			}
		}
	});
	return results;
}
