import { inflateSync } from 'node:zlib';

/**
 * Unpacks a WOFF file to the TrueType inside it. resvg only reads
 * TrueType and OpenType, and fontsource ships neither. WOFF is the
 * same tables, each zlib compressed, behind a different header.
 */
export function woff_to_ttf(woff: Buffer) {
	const table_count = woff.readUInt16BE(12);
	const tables = Array.from({ length: table_count }, (_, index) => {
		const entry = 44 + index * 20;
		const offset = woff.readUInt32BE(entry + 4);
		const compressed_length = woff.readUInt32BE(entry + 8);
		const length = woff.readUInt32BE(entry + 12);
		const data = woff.subarray(offset, offset + compressed_length);
		return {
			tag: woff.subarray(entry, entry + 4),
			checksum: woff.readUInt32BE(entry + 16),
			length,
			data: compressed_length < length ? inflateSync(data) : data,
		};
	});

	const entry_selector = Math.floor(Math.log2(table_count));
	const search_range = 2 ** entry_selector * 16;
	const header = Buffer.alloc(12 + table_count * 16);
	woff.copy(header, 0, 4, 8); // the font's flavour
	header.writeUInt16BE(table_count, 4);
	header.writeUInt16BE(search_range, 6);
	header.writeUInt16BE(entry_selector, 8);
	header.writeUInt16BE(table_count * 16 - search_range, 10);

	const bodies: Buffer[] = [];
	let offset = header.length;
	tables.forEach((table, index) => {
		const record = 12 + index * 16;
		table.tag.copy(header, record);
		header.writeUInt32BE(table.checksum, record + 4);
		header.writeUInt32BE(offset, record + 8);
		header.writeUInt32BE(table.length, record + 12);
		// Tables start on four byte boundaries
		const padded = Buffer.alloc(Math.ceil(table.length / 4) * 4);
		table.data.copy(padded);
		bodies.push(padded);
		offset += padded.length;
	});

	return Buffer.concat([header, ...bodies]);
}
