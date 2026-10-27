const SLINGSHOT = 'https://slingshot.microcosm.blue';
const USER_AGENT = 'skykit (https://skykit.dev)';
const REQUEST_TIMEOUT_MS = 5000;
const TID_ALPHABET = '234567abcdefghijklmnopqrstuvwxyz';

// DID -> PDS host rarely changes, so keep it for the process lifetime
const pds_cache = new Map<string, string>();

// A repo rev is a TID: the top 53 bits are microseconds since the epoch
export function tid_to_date(tid: string): Date | null {
	if (!/^[2-7a-z]{13}$/.test(tid)) return null;

	let value = 0n;
	for (const char of tid) {
		value = value * 32n + BigInt(TID_ALPHABET.indexOf(char));
	}
	const micros = value >> 10n;
	return new Date(Number(micros / 1000n));
}

async function fetch_json<T>(url: string): Promise<T> {
	const response = await fetch(url, {
		headers: { 'user-agent': USER_AGENT },
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
	});
	if (!response.ok) {
		throw new Error(`${response.status} from ${url}`);
	}
	return response.json() as Promise<T>;
}

async function resolve_pds(did: string): Promise<string> {
	const cached = pds_cache.get(did);
	if (cached) return cached;

	const { pds } = await fetch_json<{ pds: string }>(
		`${SLINGSHOT}/xrpc/com.bad-example.identity.resolveMiniDoc?identifier=${encodeURIComponent(did)}`,
	);
	pds_cache.set(did, pds);
	return pds;
}

// Time of the account's latest write of any kind (post, like, follow, ...)
export async function get_last_commit_date(
	did: string,
): Promise<Date | null> {
	const pds = await resolve_pds(did);
	const { rev } = await fetch_json<{ rev: string }>(
		`${pds}/xrpc/com.atproto.sync.getLatestCommit?did=${encodeURIComponent(did)}`,
	);
	return tid_to_date(rev);
}
