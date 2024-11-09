import { api_status } from '$lib/api-status.svelte';
import { rate_limiter } from '$lib/rate-limiter';

export const load = async () => {
	const rate_limit_status = rate_limiter.get_status();
	api_status.update_status(rate_limit_status);

	return {};
};
