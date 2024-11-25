import { get_db } from '$lib/db';

interface InactiveUserData {
	user_id: string;
	last_active: string;
	additional_data: string | null;
	status: string;
}

const get_user_data = async (user: {
	id: string;
}): Promise<InactiveUserData> => {
	return {
		user_id: user.id,
		last_active: new Date().toISOString(),
		additional_data: null,
		status: 'inactive',
	};
};

const process_inactive = async (user_ids: string[]) => {
	let batch_updates: InactiveUserData[] = [];
	const BATCH_SIZE = 500;

	for (const user_id of user_ids) {
		const user_data = await get_user_data({ id: user_id });
		batch_updates.push(user_data);

		if (batch_updates.length >= BATCH_SIZE) {
			await execute_batch_update(batch_updates);
			batch_updates = [];
		}
	}

	if (batch_updates.length > 0) {
		await execute_batch_update(batch_updates);
	}
};

const execute_batch_update = async (updates: InactiveUserData[]) => {
	const db = get_db();
	const tx = await db.transaction();
	try {
		for (const user of updates) {
			await tx.execute({
				sql: `
					INSERT INTO inactive_users (user_id, last_active, additional_data, status)
					VALUES (?, ?, ?, ?)
					ON CONFLICT(user_id) DO UPDATE SET
            last_active = excluded.last_active,
            additional_data = excluded.additional_data,
            status = excluded.status
				`,
				args: [
					user.user_id,
					user.last_active,
					user.additional_data,
					user.status,
				],
			});
		}
		await tx.commit();
	} catch (e) {
		await tx.rollback();
		throw e;
	}
};

export { process_inactive as process_inactives };
