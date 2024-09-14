import cron from 'node-cron';
import fs from 'fs-extra';

import { loggers, color } from '../../../utils/modules/index.js';
import configuration from '../../config/connect.js';

const PATH = {
	folder: './databases/users/limit/',
	settings: './src/helper/config/settings.json'
};

if (!(await fs.readdir(PATH.folder))) {
	await fs.mkdir(PATH.folder);
}

const files = await fs.readdir(PATH.folder);
const LIMIT = (await fs.readJSON(PATH.settings))?.limit || 100;

configuration.cache.limit = LIMIT;

(await Promise.all(files.map((file) => fs.readJSON(PATH.folder + file)))).forEach(({ id, limit, role }) =>
	configuration.user.limit.set(id, {
		limit,
		role
	})
);

export class Limit {
	static checkExist(sender) {
		return !!configuration.user.limit.get(sender);
	}

	static upsert(sender, limit, role) {
		configuration.user.limit.set(sender, {
			limit: limit,
			role: role
		});
	}

	static updateRole(sender, role) {
		const user = configuration.user.limit.get(sender);

		user.role = role;
		this.upsert(sender, user.limit, user.role);
	}

	static checkRole(sender) {
		if (configuration.cache?.ownerNumbers?.includes(sender)) {
			return { role: 'OWNER' };
		}

		const user = configuration.user.limit.get(sender);

		if (!user) {
			const data = {
				id: sender,
				limit: LIMIT,
				role: 'FREE'
			};

			this.upsert(sender, LIMIT, 'FREE');

			fs.writeJSONSync(`${PATH.folder + sender}.json`, data);

			return { role: 'FREE' };
		}

		return { role: user.role };
	}

	static addLimit(sender, limit) {
		const { role } = this.checkRole(sender);

		if (role === 'OWNER' || role === 'PREMIUM') {
			return;
		}

		const user = configuration.user.limit.get(sender);

		user.limit = user.limit + limit;
		this.upsert(sender, user.limit, user.role);
	}

	static reduceLimit(sender, limit) {
		const { role } = this.checkRole(sender);

		if (role === 'OWNER' || role === 'PREMIUM') {
			return { error: false };
		}

		const user = configuration.user.limit.get(sender);

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
		const user = configuration.user.limit.get(sender);
		const { role } = this.checkRole(sender);

		if (role === 'OWNER' || role === 'PREMIUM') {
			return '∞';
		}

		if (!user) {
			return 30;
		}

		return user.limit;
	}

	static async resetAllLimit() {
		const files = await fs.readdir(PATH.folder);

		await Promise.all(
			files.map(async (filename) => {
				const data = fs.readJSONSync(PATH.folder + filename);

				if (!['OWNER', 'PREMIUM'].includes(data.role)) {
					data.limit = LIMIT;
					fs.writeJSONSync(PATH.folder + filename, data);

					this.upsert(data.id, LIMIT, data.role);
				}
			})
		);
	}

	static async updateLimitFromCache() {
		const [usersFiles, usersCache] = [await fs.readdir(PATH.folder), configuration.user.limit.entries()];

		const usersParsed = usersFiles.map((filename) => fs.readJSONSync(PATH.folder + filename));

		await Promise.all(
			usersCache.map(([key, _data]) => {
				const index = usersParsed.findIndex((v) => v.id === key);

				if (index === -1) {
					const data = {
						id: key,
						role: _data.role,
						limit: _data.limit
					};

					fs.writeJSONSync(`${PATH.folder + key}.json`, data);

					return;
				}

				usersParsed[index].role = _data.role;
				usersParsed[index].limit = _data.limit;

				fs.writeJSONSync(`${PATH.folder + key}.json`, usersParsed[index]);
			})
		);
	}
}

export const runLimitScheduler = (OPTIONS, clearDBConnection, cli) => {
	cron.schedule(
		'0 0 * * *',
		async () => {
			await Limit.resetAllLimit();
			await Limit.updateLimitFromCache();

			loggers.WRN(`${color('Successfully reset all limit usage.', 'white')}`);

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
