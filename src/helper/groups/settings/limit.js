import cron from 'node-cron';
import dayjs from 'dayjs';
import fs from 'fs-extra';

import { INFOLOG, color } from '../../../utils/modules/index.js';

const PATH = {
	folder: './databases/users',
	files: './databases/users/limit.json'
};

const LIMIT = (await fs.readJSON('./src/helper/config/settings.json'))?.limit || 100;

if (!(await fs.readdir(PATH.folder))) {
	await fs.mkdir(PATH.folder);
}

if (!(await fs.exists(PATH.files))) {
	await fs.writeJSON(PATH.files, []);
}

export const checkUser = async (obj) => {
	const data = await fs.readJSON(PATH.files);
	const status = data.some((v) => v.id === obj.id);

	if (!status) {
		return false;
	}

	return true;
};

export const addUser = async (obj) => {
	const data = await fs.readJSON(PATH.files);

	if (!checkUser(obj)) {
		data.push(obj);
	}

	await fs.writeJSON(PATH.files, data);
	return true;
};

export const indexUser = async (obj) => {
	const data = await fs.readJSON(PATH.files);
	const index = data.findIndex((v) => v.id === obj.id);

	if (index === -1) {
		return false;
	}

	return {
		index,
		limit: data[index].limit,
		type: data[index].role
	};
};

export const updateUser = async (obj) => {
	const data = await fs.readJSON(PATH.files);

	if (indexUser(obj)) {
		for (const index in obj) {
			if (index === 'limit' && obj.type === 'MIN') {
				if (data[indexUser(obj).index][index] - obj[index] < 0) {
					return { status: false, message: 'Limit is not enough', limits: data[indexUser(obj).index][index] };
				}

				data[indexUser(obj).index][index] -= obj[index];
			} else if (obj.type !== 'MIN') {
				data[indexUser(obj).index][index] = obj[index];
			}
		}

		await fs.writeJSON(PATH.files, data);
		return data[indexUser(obj).index];
	}

	return false;
};

export const addLimit = async (obj) => {
	const data = await fs.readJSON(PATH.files);

	if (indexUser(obj)) {
		if (data[indexUser(obj).index].limit <= 0) {
			return false;
		}

		return updateUser(obj);
	}

	return addUser({
		id: obj.id,
		limit: LIMIT,
		role: 'FREE'
	});
};

export const addAllLimit = async (limit) => {
	const data = await fs.readJSON(PATH.files);

	for (const index in data) {
		data[index].limit += limit;
	}

	await fs.writeJSON(PATH.files, data);
	return true;
};

export const resetAllLimit = async () => {
	const data = await fs.readJSON(PATH.files);

	for (const index in data) {
		data[index].limit = LIMIT;
	}

	await fs.writeJSON(PATH.files, data);
	return true;
};

export const checkLimit = (users) => indexUser({ id: users });

export const addUserLimit = async (user, limit) => {
	const data = await fs.readJSON(PATH.files);

	for (const index in data) {
		if (data[index].id === user) {
			data[index].limit += limit;
		}
	}

	await fs.writeJSON(PATH.files, data);
	return true;
};

export const runLimitScheduler = (OPTIONS, clearDBConnection, cli) => {
	cron.schedule(
		'0 0 * * *',
		async () => {
			const time = dayjs().format('HH:mm:ss DD/MM');

			await resetAllLimit();
			INFOLOG(`[${color(time, 'cyan')}]`, `${color('Sukses Reset User`s Limit', 'white')}`);

			if (OPTIONS.resetOnStart) {
				await clearDBConnection(cli);
			}
		},
		{
			timezone: 'Asia/Jakarta',
			scheduled: true
		}
	);
};
