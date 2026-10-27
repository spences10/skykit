import { execFileSync } from 'node:child_process';
import { lstatSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { check_naming } from './naming.ts';
import { max_source_lines, private_path } from './policy.ts';
import { check_effects } from './runes.ts';
import { parse_source, type Finding } from './source.ts';
import {
	check_markup_ternaries,
	check_ternaries,
} from './ternaries.ts';

function git_paths(root: string, args: string[]) {
	return [
		...new Set(
			execFileSync('git', ['ls-files', '-z', ...args], {
				cwd: root,
				encoding: 'utf8',
			})
				.split('\0')
				.filter(Boolean),
		),
	].sort((a, b) => a.localeCompare(b));
}

export function inspect_repository(root: string) {
	// Git lists paths, not contents: never read private files to report a leak.
	const files = git_paths(root, [
		'--cached',
		'--others',
		'--exclude-standard',
	]);
	const findings: Finding[] = [];
	const report = (file: string, rule: string, message: string) =>
		findings.push({ file, line: 1, rule, message });
	for (const file of git_paths(root, ['--cached']).filter(
		private_path,
	)) {
		report(
			file,
			'tracked-private',
			'Private material is staged/tracked. Remove it from the Git index without deleting the local file.',
		);
	}
	for (const file of ['.env', 'local.db', 'local.db-wal']) {
		try {
			execFileSync(
				'git',
				['check-ignore', '--no-index', '--quiet', file],
				{ cwd: root, stdio: 'pipe' },
			);
		} catch {
			report(
				'.gitignore',
				'private-ignore',
				`${file} must be ignored.`,
			);
		}
	}
	let source_count = 0;
	for (const file of files.filter(
		(file) =>
			/^(?:src|e2e|tools\/checks)\//.test(file) &&
			/\.(?:ts|svelte)$/.test(file),
	)) {
		if (
			lstatSync(join(root, file), {
				throwIfNoEntry: false,
			})?.isFile() !== true
		)
			continue;
		source_count++;
		const text = readFileSync(join(root, file), 'utf8');
		if (text.trimEnd().split('\n').length > max_source_lines) {
			report(
				file,
				'file-budget',
				`Source exceeds ${max_source_lines} lines. Split responsibilities; do not raise the budget to pass.`,
			);
		}
		const source = parse_source(file, text);
		findings.push(
			...check_naming(source),
			...check_effects(source),
			...check_ternaries(source),
		);
		if (file.endsWith('.svelte')) {
			findings.push(...check_markup_ternaries(file, text));
		}
	}
	return { findings, source_count };
}
