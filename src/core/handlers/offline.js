import dayjs from 'dayjs';
import fs from 'fs-extra';

import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { color, loggers } from '../../utils/modules/index.js';

const OFFLINE_DB_PATH = './databases/offline_db/users.json';

const offlineHandler = async (client, { isGroup, from, sender, message }) => {
	try {
		if (isGroup) {
			return;
		}

		let data = [];

		if (await fs.pathExists(OFFLINE_DB_PATH)) {
			data = await fs.readJSON(OFFLINE_DB_PATH);
		} else {
			await fs.writeJSON(OFFLINE_DB_PATH, []);
		}

		const dataUser = data.find((v) => v.participant === sender);
		const dateNow = dayjs.tz().valueOf();

		if (!dataUser || dateNow > dayjs(dataUser.date).add(30, 's').valueOf()) {
			dataUser ? (dataUser.date = dateNow) : data.push({ participant: sender, date: dateNow });

			await fs.writeJSON(OFFLINE_DB_PATH, data, { spaces: 2 });
			const locale = await getLocale(from);
			const L = useLocale(locale, 'common');
			await client.reply(from, L.core.errors.ownerOffline, message);
		}
	} catch (err) {
		loggers.error(color('Offline handler failed:', 'red'), err);
	}
};

export default offlineHandler;
