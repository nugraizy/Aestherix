import cron from 'node-cron';
import dayjs from 'dayjs';
import fs from 'fs-extra';

import { INFOLOG, color } from '../../../utils/modules/index.js';
import { Cache } from '../../modules/cache.js';
import configuration from '../../config/connect.js';

const PATH = {
	folder: './databases/users',
	files: './databases/users/limit.json',
	settings: './src/helper/config/settings.json'
};

const cache = new Cache();

if (!(await fs.readdir(PATH.folder))) {
	await fs.mkdir(PATH.folder);
}

if (!(await fs.exists(PATH.files))) {
	await fs.writeJSON(PATH.files, []);
}

const users = await fs.readJSON(PATH.files);
const LIMIT = (await fs.readJSON(PATH.settings))?.limit || 100;

configuration.cache.limit = LIMIT;

users.forEach((element) => {
	cache.set(element.id, {
		limit: element.limit,
		role: element.role
	});
});

export class Limit {
	static checkExist(sender) {
		return !!cache.get(sender);
	}

	static upsert(sender, limit, role) {
		cache.set(sender, {
			limit: limit,
			role: role
		});
	}

	static updateRole(sender, role) {
		const user = cache.get(sender);

		user.role = role;
		this.upsert(sender, user.limit, user.role);
	}

	static checkRole(sender) {
		if (configuration.cache?.ownerNumbers?.includes(sender)) {
			return { role: 'OWNER' };
		}

		const user = cache.get(sender);

		return { role: user.role };
	}

	static addLimit(sender, limit) {
		const { role } = this.checkRole(sender);

		if (role === 'OWNER' || role === 'PREMIUM') {
			return;
		}

		const user = cache.get(sender);

		user.limit = user.limit + limit;
		this.upsert(sender, user.limit, user.role);
	}

	static reduceLimit(sender, limit) {
		const { role } = this.checkRole(sender);

		if (role === 'OWNER' || role === 'PREMIUM') {
			return { error: false };
		}

		const user = cache.get(sender);

		if (user.limit === 0) {
			return {
				error: true,
				message: 'You have reached the limit of this command.'
			};
		}

		const tempLimit = user.limit - limit;

		if (tempLimit < 0) {
			return {
				error: true,
				message: `Limit is not enough.\nYour limit is ${user.limit}.\n%s`
			};
		}

		this.upsert(sender, tempLimit, user.role);

		return {
			error: false
		};
	}

	/**
	 *
	 * @param {string} sender
	 * @returns {number | string}
	 */
	static checkLimit(sender) {
		const user = cache.get(sender);
		const { role } = this.checkRole(sender);

		if (role === 'OWNER' || role === 'PREMIUM') {
			return '∞';
		}

		if (!user) {
			return 30;
		} else {
			return user.limit;
		}
	}

	static async resetAllLimit() {
		const users = await fs.readJSON('./databases/users/limit.json');

		users.forEach((element, i) => {
			const exist = this.checkExist(element.id);

			if (!exist) {
				this.upsert(element.id, element.limit, element.role);
			} else {
				const { role } = this.checkRole(element.id);

				if (!(role === 'OWNER' || role === 'PREMIUM')) {
					users[i].limit = LIMIT;
					this.upsert(element.id, LIMIT, element.role);
					return;
				}
			}
		});

		await fs.writeJSON('./databases/users/limit.json', users, {
			spaces: 2
		});
	}

	static async updateLimitFromCache() {
		const [usersFile, usersCache] = [await fs.readJSON('./databases/users/limit.json'), cache.entries()];

		usersCache.forEach((element) => {
			const index = usersFile.findIndex((user) => user.id === element[0]);

			if (index !== -1) {
				usersFile[index].limit = element[1].limit;
				usersFile[index].role = element[1].role;

				return;
			}

			usersFile.push({
				id: element[0],
				limit: element[1].limit,
				role: element[1].role
			});
		});

		await fs.writeJSON('./databases/users/limit.json', usersFile, {
			spaces: 2
		});
	}
}

export const runLimitScheduler = (OPTIONS, clearDBConnection, cli) => {
	cron.schedule(
		'0 0 * * *',
		async () => {
			const time = dayjs().format('HH:mm:ss DD/MM');

			await Limit.resetAllLimit();
			await Limit.updateLimitFromCache();

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
