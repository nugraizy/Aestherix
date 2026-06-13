import fs from 'fs-extra';
import cron from 'node-cron';

import { color, loggers } from '../../../utils/modules/index.js';
import configuration from '../../config/connect.js';
import { getAllUserLimits, upsertUserLimit } from '../../database/adapters/user.js';
import prisma from '../../database/prisma.js';

const SETTINGS_PATH = './src/helper/config/settings.json';

const LIMIT = (await fs.readJSON(SETTINGS_PATH).catch(() => ({}))).limit || 100;

configuration.defaultLimit = LIMIT;

try {
	const rows = await getAllUserLimits(prisma);

	for (const { id, limit, role } of rows) {
		configuration.userLimit.set(id, { limit, role });
	}
} catch {
	// DB may not be reachable on first boot; the cache starts empty.
}

export class Limit {
	static checkExist(sender) {
		return !!configuration.userLimit.get(sender);
	}

	static upsert(sender, limit, role) {
		configuration.userLimit.set(sender, {
			limit: limit,
			role: role
		});
	}

	static updateRole(sender, role) {
		const user = configuration.userLimit.get(sender);

		user.role = role;
		this.upsert(sender, user.limit, user.role);
	}

	static checkRole(sender) {
		if (!sender) {
			return { role: 'FREE' };
		}

		if (configuration.owners?.includes(sender)) {
			return { role: 'OWNER' };
		}

		const user = configuration.userLimit.get(sender);

		if (!user) {
			this.upsert(sender, LIMIT, 'FREE');
			void upsertUserLimit(prisma, sender, LIMIT, 'FREE');

			return { role: 'FREE' };
		}

		return { role: user.role };
	}

	static addLimit(sender, limit) {
		const { role } = this.checkRole(sender);

		if (role === 'OWNER' || role === 'PREMIUM') {
			return;
		}

		const user = configuration.userLimit.get(sender);

		user.limit = user.limit + limit;
		this.upsert(sender, user.limit, user.role);
	}

	static reduceLimit(sender, limit) {
		const { role } = this.checkRole(sender);

		if (role === 'OWNER' || role === 'PREMIUM') {
			return { error: false };
		}

		const user = configuration.userLimit.get(sender);

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
		const user = configuration.userLimit.get(sender);
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
		const tasks = [];

		for (const [id, data] of configuration.userLimit.entries()) {
			if (!['OWNER', 'PREMIUM'].includes(data.role)) {
				this.upsert(id, LIMIT, data.role);
				tasks.push(upsertUserLimit(prisma, id, LIMIT, data.role));
			}
		}

		if (tasks.length) {
			await Promise.all(tasks);
		}
	}

	static async updateLimitFromCache() {
		const tasks = [];

		for (const [id, data] of configuration.userLimit.entries()) {
			tasks.push(upsertUserLimit(prisma, id, data.limit, data.role));
		}

		if (tasks.length) {
			await Promise.all(tasks);
		}
	}
}

export const runLimitScheduler = () => {
	cron.schedule(
		'0 0 * * *',
		async () => {
			await Limit.resetAllLimit();
			await Limit.updateLimitFromCache();

			loggers.warning(`${color('Successfully reset all limit usage.', 'white')}`);
		},
		{
			timezone: 'Asia/Jakarta',
			scheduled: true
		}
	);
};
