import { describe, expect, it } from 'vitest';
import { pds_from_did_doc, tid_to_date } from './repo-activity';

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

describe('pds_from_did_doc', () => {
	it('returns the atproto PDS endpoint', () => {
		expect(
			pds_from_did_doc({
				service: [
					{
						id: '#atproto_pds',
						type: 'AtprotoPersonalDataServer',
						serviceEndpoint: 'https://pds.example.com',
					},
				],
			}),
		).toBe('https://pds.example.com');
	});

	it('returns null when the document has no PDS', () => {
		expect(pds_from_did_doc({})).toBeNull();
		expect(
			pds_from_did_doc({
				service: [
					{
						id: '#bsky_notif',
						type: 'BskyNotificationService',
						serviceEndpoint: 'https://example.com',
					},
				],
			}),
		).toBeNull();
	});
});
