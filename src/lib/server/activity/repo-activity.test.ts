import { describe, expect, it } from 'vitest';
import { tid_to_date } from './repo-activity';

describe('tid_to_date', () => {
	it('decodes a repo rev to its timestamp', () => {
		expect(tid_to_date('3myidd2wmch2s')?.toISOString()).toBe(
			'2026-10-22T18:49:16.214Z',
		);
	});

	it('returns null for anything that is not a TID', () => {
		expect(tid_to_date('')).toBeNull();
		expect(tid_to_date('not-a-tid')).toBeNull();
		expect(tid_to_date('3MYIDD2WMCH2S')).toBeNull();
	});
});
