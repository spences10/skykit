import type { InactiveFollow } from '$lib/types';

export type Progress = {
    processed: number;
    total: number;
    current: string;
    start_time: Date;
};

export function create_inactive_state() {
    let loading = $state(false);
    let inactive_follows = $state<InactiveFollow[]>([]);
    let error = $state<string | undefined>(undefined);
    let progress = $state<Progress>({
        processed: 0,
        total: 0,
        current: '',
        start_time: new Date()
    });

    const reset_progress = () => {
        progress = {
            processed: 0,
            total: 0,
            current: '',
            start_time: new Date()
        };
    };

    const fetch_inactive_follows = async (handle: string, days: number, sort: 'last_post' | 'handle') => {
        loading = true;
        error = undefined;
        reset_progress();
        inactive_follows = [];

        try {
            const eventSource = new EventSource(
                `/api/user/inactive?handle=${encodeURIComponent(handle)}&days=${days}&sort=${sort}&stream=true`
            );

            eventSource.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    if (data.type === 'progress') {
                        progress = {
                            ...progress,
                            processed: data.processed,
                            total: data.total,
                            current: data.current
                        };
                    } else if (data.type === 'complete') {
                        inactive_follows = data.inactive_follows;
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
        get loading() { return loading; },
        get inactive_follows() { return inactive_follows; },
        get error() { return error; },
        get progress() { return progress; },
        fetch_inactive_follows
    };
}

export const inactive_state = create_inactive_state(); 