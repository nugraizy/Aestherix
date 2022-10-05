import path from 'path';

import { __dirname } from '../../../index.js';
import { isFileExist, makeDir, readDir, readJSON, writeJSON } from '../../index.js';

const PATH = {
	folder: path.join(__dirname, 'Databases/Users'),
	files: path.join(__dirname, 'Databases/Users/limit.json'),
};

const LIMIT = readJSON('./Config/settings.json')?.limit || 100;

if (!readDir(PATH.folder)) {
	makeDir(PATH.folder);
}

if (!isFileExist(PATH.files)) {
	writeJSON(PATH.files, []);
}

export const checkUser = (obj) => {
	const data = readJSON(PATH.files);
	const status = data.some((v) => v.id == obj.id);

	if (!status) {
		return false;
	}

	return true;
};

export const addUser = (obj) => {
	const data = readJSON(PATH.files);

	if (!checkUser(obj)) {
		data.push(obj);
	}

	writeJSON(PATH.files, data);
	return true;
};

export const indexUser = (obj) => {
	const data = readJSON(PATH.files);
	const index = data.findIndex((v) => v.id == obj.id);

	if (index == -1) {
		return false;
	}

	return {
		index,
		limit: data[index].limit,
		type: data[index].role,
	};
};

export const updateUser = (obj) => {
	const data = readJSON(PATH.files);

	if (indexUser(obj) !== false) {
		for (const index in obj) {
			if (index == 'limit' && obj.type == 'MIN') {
				if (data[indexUser(obj).index][index] - obj[index] < 0) {
					return { status: false, message: 'Limit is not enough', limits: data[indexUser(obj).index][index] };
				}

				data[indexUser(obj).index][index] -= obj[index];
			} else if (obj.type !== 'MIN') {
				data[indexUser(obj).index][index] = obj[index];
			}
		}

		writeJSON(PATH.files, data);
		return data[indexUser(obj).index];
	}

	return false;
};

export const addLimit = (obj) => {
	const data = readJSON(PATH.files);

	if (indexUser(obj) !== false) {
		if (data[indexUser(obj).index].limit <= 0) {
			return false;
		}

		return updateUser(obj);
	}

	return addUser({
		id: obj.id,
		limit: LIMIT,
		role: 'FREE',
	});
};

export const addAllLimit = (limit) => {
	const data = readJSON(PATH.files);

	for (const index in data) {
		data[index].limit += limit;
	}

	writeJSON(PATH.files, data);
	return true;
};

export const resetAllLimit = () => {
	const data = readJSON(PATH.files);

	for (const index in data) {
		data[index].limit = LIMIT;
	}

	writeJSON(PATH.files, data);
	return true;
};

export const checkLimit = (users) => {
	return indexUser({ id: users });
};

export const addUserLimit = (user, limit) => {
	const data = readJSON(PATH.files);

	for (const index in data) {
		if (data[index].id == user) {
			data[index].limit += limit;
		}
	}

	writeJSON(PATH.files, data);
	return true;
};
