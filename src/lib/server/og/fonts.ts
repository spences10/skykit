import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { woff_to_ttf } from './woff';

// Manrope, the site's font, as static cuts: resvg doesn't apply
// variable font weights, and its native build loads fonts from disk,
// not from memory. Written once per process.
const weights = [500, 700, 800];

let font_files: string[] | undefined;

export function get_font_files() {
	if (font_files) return font_files;
	const require = createRequire(import.meta.url);
	const dir = mkdtempSync(join(tmpdir(), 'skykit-og-fonts-'));
	font_files = weights.map((weight) => {
		const path = join(dir, `manrope-${weight}.ttf`);
		const woff = readFileSync(
			require.resolve(
				`@fontsource/manrope/files/manrope-latin-${weight}-normal.woff`,
			),
		);
		writeFileSync(path, woff_to_ttf(woff));
		return path;
	});
	return font_files;
}
