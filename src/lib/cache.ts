// Simple in-memory cache with expiration
export class Cache<T> {
	private store = new Map<string, { data: T; timestamp: number }>();
	private ttl: number;

	constructor(ttl_minutes = 5) {
		this.ttl = ttl_minutes * 60 * 1000;
	}

	set(key: string, data: T) {
		this.store.set(key, {
			data,
			timestamp: Date.now(),
		});
	}

	get(key: string): T | null {
		const item = this.store.get(key);
		if (!item) return null;

		if (Date.now() - item.timestamp > this.ttl) {
			this.store.delete(key);
			return null;
		}

		return item.data;
	}
}
