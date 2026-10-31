/**
 * HTTP status for a failed Bluesky call. XRPC errors carry the upstream
 * status, but a missing profile comes back as 400 and a network failure
 * as status 1, which SvelteKit's error() rejects.
 */
export function to_http_status(
	err: unknown,
	message: string,
): number {
	const status =
		err && typeof err === 'object' && 'status' in err
			? Number(err.status)
			: 500;
	if (status === 400 && /profile not found/i.test(message))
		return 404;
	if (status >= 400 && status <= 599) return status;
	// Upstream unreachable or answered with something unusable
	return 502;
}
