import { get_db } from './connection';

export const store_stat = async (type: string, value: unknown) => {
	const client = get_db();
	await client.execute({
		sql: 'INSERT INTO stats (type, value) VALUES (?, ?)',
		args: [type, JSON.stringify(value)],
	});
};
