import { addMinutes, isAfter, isFuture } from 'date-fns';

interface CacheItem<T> {
	data: T;
	expiry: Date;
}

export class Cache<T> {
	private store = new Map<string, CacheItem<T>>();
	private readonly ttl_minutes: number;

	constructor(ttl_minutes = 5) {
		this.ttl_minutes = ttl_minutes;
	}

	set(key: string, data: T): void {
		this.store.set(key, {
			data,
			expiry: addMinutes(new Date(), this.ttl_minutes),
		});
		this.cleanup();
	}

	get(key: string): T | null {
		const item = this.store.get(key);
		if (!item) return null;

		if (isFuture(item.expiry)) {
			return item.data;
		}

		this.cleanup(key);
		return null;
	}

	private cleanup(specific_key?: string): void {
		if (specific_key) {
			this.store.delete(specific_key);
			return;
		}

		const now = new Date();
		for (const [key, item] of this.store.entries()) {
			if (isAfter(now, item.expiry)) {
				this.store.delete(key);
			}
		}
	}

	clear(): void {
		this.store.clear();
	}

	size(): number {
		this.cleanup();
		return this.store.size;
	}
}
