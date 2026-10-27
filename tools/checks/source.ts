import ts from 'typescript';

export interface Finding {
	file: string;
	line: number;
	rule: string;
	message: string;
}

export interface Source {
	file: string;
	ast: ts.SourceFile;
}

export function parse_source(file: string, text: string): Source {
	let script = text;
	if (/\.(?:svelte|md)$/.test(file)) {
		// Preserve offsets for diagnostics; inspect script blocks, not markup.
		const chars = text
			.split('')
			.map((char) => (/[\r\n]/.test(char) ? char : ' '));
		const markup = text.replace(/<!--[\s\S]*?-->/g, (comment) =>
			comment.replace(/[^\r\n]/g, ' '),
		);
		for (const match of markup.matchAll(
			/<script\b[^>]*>([\s\S]*?)<\/script\s*>/g,
		)) {
			const content = match[1];
			const start = match.index + match[0].indexOf('>') + 1;
			for (let index = 0; index < content.length; index++)
				chars[start + index] = content[index];
		}
		script = chars.join('');
	}
	return {
		file,
		ast: ts.createSourceFile(
			file,
			script,
			ts.ScriptTarget.Latest,
			true,
			ts.ScriptKind.TS,
		),
	};
}

export function finding(
	source: Source,
	node: ts.Node,
	rule: string,
	message: string,
): Finding {
	return {
		file: source.file,
		line:
			source.ast.getLineAndCharacterOfPosition(
				node.getStart(source.ast),
			).line + 1,
		rule,
		message,
	};
}

export function walk(node: ts.Node, visit: (node: ts.Node) => void) {
	visit(node);
	ts.forEachChild(node, (child) => walk(child, visit));
}
