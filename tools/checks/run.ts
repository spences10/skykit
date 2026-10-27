import { fileURLToPath } from 'node:url';
import { inspect_repository } from './repository.ts';

try {
	const { findings, source_count } = inspect_repository(
		fileURLToPath(new URL('../../', import.meta.url)),
	);
	for (const result of findings)
		console.error(
			`${result.file}:${result.line} [${result.rule}] ${result.message}`,
		);
	console.log(
		`Guardrails: ${findings.length} error(s), ${source_count} source file(s).`,
	);
	if (findings.length) process.exitCode = 1;
} catch (error) {
	console.error(
		`Guardrails could not run: ${error instanceof Error ? error.message : String(error)}`,
	);
	process.exitCode = 1;
}
