import type {
	CacheStats,
	InactiveFollow,
	ProcessingStage,
} from '$lib/types';

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
	let has_checked = $state(false);
	let inactive_follows = $state<InactiveFollow[]>([]);
	let error = $state<string | undefined>(undefined);
	let cache_stats = $state<CacheStats | undefined>(undefined);
	let days_threshold = $state(30);
	let show_never_posted = $state(false);
	let hide_follows_back = $state(false);
	let sort_direction = $state<'asc' | 'desc'>('desc');
	let progress = $state<Progress>({
		stage: 'cache',
		processed: 0,
		total: 0,
		current: '',
		start_time: new Date(),
		average_time_per_item: undefined,
		cache_hits: 0,
		cache_misses: 0,
	});

	const filtered_and_sorted_follows = $derived.by(() => {
		let result = [...inactive_follows];

		// Apply never posted filter if enabled
		if (show_never_posted) {
			result = result.filter(
				(follow) => follow.lastPost === '1970-01-01T00:00:00.000Z',
			);
		}

		// Filter out accounts that follow back if enabled
		if (hide_follows_back) {
			result = result.filter((follow) => !follow.follows_back);
		}

		// Apply sorting
		result.sort((a, b) => {
			const dateA = new Date(a.lastPost).getTime();
			const dateB = new Date(b.lastPost).getTime();
			return sort_direction === 'asc' ? dateA - dateB : dateB - dateA;
		});

		return result;
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
			cache_misses: 0,
		};
	};

	const fetch_inactive_follows = async (
		handle: string,
		days: number,
	) => {
		loading = true;
		error = undefined;
		reset_progress();
		inactive_follows = [];
		cache_stats = undefined;
		has_checked = true;
		days_threshold = days;

		try {
			const eventSource = new EventSource(
				`/api/user/inactive?handle=${encodeURIComponent(handle)}&days=${days}&stream=true`,
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
							start_time: progress.start_time, // Preserve the original start time
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
		get has_checked() {
			return has_checked;
		},
		get inactive_follows() {
			return inactive_follows;
		},
		get filtered_and_sorted_follows() {
			return filtered_and_sorted_follows;
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
		get days_threshold() {
			return days_threshold;
		},
		set days_threshold(value: number) {
			days_threshold = value;
		},
		get show_never_posted() {
			return show_never_posted;
		},
		set show_never_posted(value: boolean) {
			show_never_posted = value;
		},
		get hide_follows_back() {
			return hide_follows_back;
		},
		set hide_follows_back(value: boolean) {
			hide_follows_back = value;
		},
		get sort_direction() {
			return sort_direction;
		},
		set sort_direction(value: 'asc' | 'desc') {
			sort_direction = value;
		},
		fetch_inactive_follows,
	};
}

export const inactive_state = create_inactive_state();
