import assert from 'node:assert/strict';
import { test } from 'node:test';
import { check_naming } from './naming.ts';
import { parse_source } from './source.ts';

function check(text: string, file = 'packages/core/src/example.ts') {
	return check_naming(parse_source(file, text));
}

await test('allows snake_case bindings/functions and PascalCase types without changing contract keys or library names', () => {
	assert.deepEqual(
		check(`
		import { execFileSync } from 'node:child_process';
		import { afterEach } from 'vite-plus/test';
		import path from 'node:path';
		import * as filesystem from 'node:fs';
		export { execFileSync } from 'node:child_process';
		import { save_profile, type ProfileVersion } from '#lib/profile.js';
		interface AuthConfig { displayName: string; createdAt: string }
		type ProfileState = AuthConfig;
		class ProfileError extends Error {}
		const { baseURL: base_url, ...rest_fields } = config;
		const [first_user] = users;
		const fetch_user = (user_id: string) => user_id;
		function save_user(expected_version: number) { return { expectedVersion: expected_version }; }
		const options = { baseURL: base_url, getSession: () => null };
		options.getSession();
		export { fetch_user, ProfileState };
	`),
		[],
	);
});

for (const source of [
	'const testConfig = {};',
	'let currentUser; var oldUser;',
	'const AUTH_BASE_URL = "synthetic";',
	'function authFixture() {}',
	'const run = function namedFunction() {};',
	'const run = (userId: string) => userId;',
	'const { baseURL } = config;',
	'const { user: { displayName }, ...restProps } = config;',
	'const [firstUser] = users;',
	'import appHelpers from "./helpers.ts";',
	'import * as appHelpers from "./helpers.ts";',
	'import { authFixture } from "./fixture.ts";',
	'import { testConfig as test_config } from "./fixture.ts";',
	'export { authFixture as auth_fixture } from "./fixture.ts";',
	'export { auth_fixture as authFixture };',
	'import { execFileSync as exec_file_sync } from "node:child_process";',
	'export { execFileSync as exec_file_sync } from "node:child_process";',
	'interface auth_config {}',
	'type profile_state = string;',
]) {
	await test(`rejects inconsistent naming: ${source}`, () => {
		assert.ok(
			check(source).every((finding) => finding.rule === 'naming'),
		);
		assert.ok(check(source).length > 0);
	});
}

await test('keeps required SvelteKit HTTP export names scoped to endpoint files', () => {
	const code =
		'export const GET = () => new Response(); export async function POST() {}';
	assert.deepEqual(
		check(code, 'src/routes/api/example/+server.ts'),
		[],
	);
	assert.equal(check(code).length, 2);
});

await test('checks authored Svelte/Markdown script bindings with preserved lines, not inert markup or text', () => {
	for (const extension of ['svelte', 'md']) {
		const findings = check(
			'<h1>testConfig</h1>\n<script lang="ts">\nconst testConfig = {};\n</script>',
			`src/example.${extension}`,
		);
		assert.equal(findings.length, 1);
		assert.equal(findings[0].line, 3);
	}
	assert.deepEqual(
		check('const source = "const testConfig = {}";'),
		[],
	);
});

await test('leaves vendored shadcn-svelte primitives with upstream names, but not app components', () => {
	const code =
		'export const buttonVariants = {}; let { className, ...restProps } = props;';
	assert.deepEqual(
		check(code, 'src/lib/components/ui/button/variants.ts'),
		[],
	);
	assert.equal(
		check(code, 'src/lib/components/workspace-header.ts').length,
		3,
	);
});

await test('allows snake_case owned properties, quoted/object-literal keys and allowlisted external contract keys', () => {
	assert.deepEqual(
		check(`
		interface ProfileDetails { display_name: string; save(details: string): void }
		type OpportunityPage = { items: string[]; has_more: boolean };
		interface Profile { displayName?: string; createdAt: string }
		interface Headers { 'Content-Type': string; 'x-requestId': string }
		class ProfileStore { recorded_at = ''; #owner_id = ''; current_version() {} }
		const options = { baseURL: 'synthetic', emailAndPassword: { enabled: true } };
	`),
		[],
	);
});

for (const source of [
	'interface ProfileDetails { bioText: string }',
	'type OpportunityPage = { hasMore: boolean };',
	'let page: { items: string[]; hasMore: boolean };',
	'interface ProfileRepository { currentVersion(): void }',
	'class ProfileStore { recordedAt = ""; }',
	'class ProfileStore { #ownerId = ""; }',
	'class ProfileStore { currentVersion() {} }',
	'function save(options: { descriptionPath: string }) {}',
]) {
	await test(`rejects camelCase owned property: ${source}`, () => {
		const findings = check(source);
		assert.equal(findings.length, 1);
		assert.equal(findings[0].rule, 'naming');
		assert.match(
			findings[0].message,
			/property names use snake_case/,
		);
	});
}

await test('checks Svelte script property declarations but leaves vendored primitives unchanged', () => {
	const code =
		'interface Props { className: string; open_state: boolean }';
	assert.equal(
		check(
			`<script lang="ts">\n${code}\n</script>`,
			'src/lib/components/workspace-header.svelte',
		).length,
		1,
	);
	assert.deepEqual(
		check(code, 'src/lib/components/ui/button/types.ts'),
		[],
	);
});
