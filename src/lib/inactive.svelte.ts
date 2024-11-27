import type { InactiveFollow, ProcessingStage, CacheStats } from '$lib/types';

export type Progress = {
	stage: ProcessingStage;
	processed: number;
	total: number;
	current: string;
	start_time: Date;
	average_time_per_item?: number;
	cached?: boolean;
	batch_progress?: {
		current: number;
		total: number;
	};
	data_source?: 'cache' | 'api';
	current_batch_source?: string;
	cache_hits: number;
	cache_misses: number;
};

export function create_inactive_state() {
	let loading = $state(false);
	let inactive_follows = $state<InactiveFollow[]>([]);
	let error = $state<string | undefined>(undefined);
	let cache_stats = $state<CacheStats | undefined>(undefined);
	let progress = $state<Progress>({
		stage: 'cache',
		processed: 0,
		total: 0,
		current: '',
		start_time: new Date(),
		average_time_per_item: undefined,
		cache_hits: 0,
		cache_misses: 0
	});

	const reset_progress = () => {
		progress = {
			stage: 'cache',
			processed: 0,
			total: 0,
			current: '',
			start_time: new Date(),
			average_time_per_item: undefined,
			cache_hits: 0,
			cache_misses: 0
		};
	};

	const fetch_inactive_follows = async (
		handle: string,
		days: number,
		sort: 'last_post' | 'handle',
	) => {
		loading = true;
		error = undefined;
		reset_progress();
		inactive_follows = [];
		cache_stats = undefined;

		try {
			const eventSource = new EventSource(
				`/api/user/inactive?handle=${encodeURIComponent(handle)}&days=${days}&sort=${sort}&stream=true`,
			);

			eventSource.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);

					if (data.type === 'progress') {
						const elapsed =
							(new Date().getTime() - progress.start_time.getTime()) /
							1000;
						const avg_time =
							data.processed > 0
								? elapsed / data.processed
								: undefined;

						progress = {
							...progress,
							...data,
							average_time_per_item: avg_time,
							start_time: progress.start_time // Preserve the original start time
						};
					} else if (data.type === 'complete') {
						inactive_follows = data.inactive_follows;
						cache_stats = data.cache_stats;
						eventSource.close();
						loading = false;
					}
				} catch (e) {
					console.error('Failed to parse event:', e);
				}
			};

			eventSource.onerror = () => {
				error = 'Connection lost';
				eventSource.close();
				loading = false;
			};
		} catch (err) {
			console.error('Error:', err);
			error = 'Failed to fetch inactive follows';
			loading = false;
		}
	};

	return {
		get loading() {
			return loading;
		},
		get inactive_follows() {
			return inactive_follows;
		},
		get error() {
			return error;
		},
		get progress() {
			return progress;
		},
		get cache_stats() {
			return cache_stats;
		},
		fetch_inactive_follows,
	};
}

export const inactive_state = create_inactive_state();
