import cron from 'node-cron';
import fs from 'fs-extra';

import { INFOLOG, color } from '../../../utils/modules/index.js';
import configuration from '../../config/connect.js';

const PATH = {
	folder: './databases/users/limit/',
	settings: './src/helper/config/settings.json'
};

if (!(await fs.readdir(PATH.folder))) {
	await fs.mkdir(PATH.folder);
}

const filenames = await fs.readdir(PATH.folder);
const LIMIT = (await fs.readJSON(PATH.settings))?.limit || 100;

configuration.cache.limit = LIMIT;

for (const filename of filenames) {
	const { id, limit, role } = JSON.parse(filename);

	configuration.user.limit.set(id, {
		limit,
		role
	});
}

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
			const filename = JSON.stringify({
				id: sender,
				limit: LIMIT,
				role: 'FREE'
			});

			this.upsert(sender, LIMIT, 'FREE');

			fs.writeFileSync(PATH.folder + filename, '');

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
		const filenames = await fs.readdir(PATH.folder);

		for (const filename of filenames) {
			const user = JSON.parse(filename);

			if (!['OWNER', 'PREMIUM'].includes(user.role)) {
				user.limit = LIMIT;
				await fs.rename(PATH.folder + filename, PATH.folder + JSON.stringify(user));

				this.upsert(user.id, LIMIT, user.role);
			}
		}
	}

	static async updateLimitFromCache() {
		const [usersFiles, usersCache] = [await fs.readdir(PATH.folder), configuration.user.limit.entries()];

		const safeParse = (element) => {
			try {
				return JSON.parse(element);
			} catch (error) {
				return {};
			}
		};

		const usersParsed = usersFiles.map((v) => safeParse(v));

		usersCache.forEach(async (element) => {
			const index = usersParsed.findIndex((v) => v.id === element[0]);

			if (index === -1) {
				const filename = JSON.stringify({
					id: element[0],
					role: element[1].role,
					limit: element[1].limit
				});

				await fs.writeFile(PATH.folder + filename, '');

				return;
			}

			const oldFilename = JSON.stringify(usersParsed[index]);

			usersParsed[index].role = element[1].role;
			usersParsed[index].limit = element[1].limit;

			const newFilename = JSON.stringify(usersParsed[index]);

			await fs.rename(PATH.folder + oldFilename, PATH.folder + newFilename);
		});
	}
}

export const runLimitScheduler = (OPTIONS, clearDBConnection, cli) => {
	cron.schedule(
		'0 0 * * *',
		async () => {
			await Limit.resetAllLimit();
			await Limit.updateLimitFromCache();

			INFOLOG(`${color('Sukses Reset User`s Limit', 'white')}`);

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
