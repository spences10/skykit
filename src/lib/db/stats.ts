import { get_db } from './connection';

export const store_stat = async (type: string, value: unknown) => {
	get_db()
		.prepare('INSERT INTO stats (type, value) VALUES (?, ?)')
		.run(type, JSON.stringify(value));
};
