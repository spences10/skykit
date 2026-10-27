export const max_source_lines = 300;
// Property names that owned types must mirror from external contracts:
// Bluesky AppView profile and record fields.
export const external_property_names = new Set([
	'displayName',
	'createdAt',
]);
// No vendored UI source in skykit; kept so the shared checks read the same.
export const vendored_ui = 'src/lib/components/ui/';

export function private_path(file: string): boolean {
	return (
		(/(?:^|\/)\.env(?:\.|$)/.test(file) &&
			!file.endsWith('/.env.example') &&
			file !== '.env.example') ||
		/\.(?:db|sqlite3?)(?:-(?:wal|shm|journal))?$/.test(file)
	);
}
