import { describe, expect, it } from 'vitest';
import { to_http_status } from './http-status';

describe('to_http_status', () => {
	it('maps a missing profile to 404', () => {
		expect(to_http_status({ status: 400 }, 'Profile not found')).toBe(
			404,
		);
	});

	it('keeps other HTTP error statuses', () => {
		expect(to_http_status({ status: 400 }, 'Bad handle')).toBe(400);
		expect(to_http_status({ status: 429 }, 'Slow down')).toBe(429);
	});

	it('maps network failures and non-HTTP statuses to 502', () => {
		expect(to_http_status({ status: 1 }, 'fetch failed')).toBe(502);
		expect(to_http_status({ status: 200 }, 'odd')).toBe(502);
	});

	it('defaults to 500 when there is no status', () => {
		expect(to_http_status(new Error('boom'), 'boom')).toBe(500);
	});
});
