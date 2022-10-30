/* global botNum, log */
import dayjs from 'dayjs';

import { isFileExist, readJSON, writeJSON } from '../../helper/modules/index.js';

export default {
	async handler(client, { isGroup, from, sender, message }) {
		try {
			if (isGroup) {
				return;
			}

			if (!isFileExist('./databases/offline_db/users.json')) {
				writeJSON('./databases/offline_db/users.json', []);
			}

			const data = readJSON('./databases/offline_db/users.json');

			if (data.length == 0) {
				data.push({
					participant: sender,
					date: dayjs().valueOf(),
				});
				writeJSON('./databases/offline_db/users.json', JSON.parse(JSON.stringify(data, undefined, 2)));
				await client[botNum].reply({ from, quoted: message }, 'The owner currently offline, please contact in another time.');
				return;
			}

			const dataUser = data.find((v) => v.participant == sender);
			const dateOff = dataUser ? dataUser.date : 0;
			const waitTil30Second = dataUser ? dayjs(dateOff).add(30, 's').valueOf() : 0;
			const dateNow = dayjs().valueOf();

			if (dataUser && dateNow > waitTil30Second) {
				dataUser.date = dayjs().valueOf();
				await client[botNum].reply({ from, quoted: message }, 'The owner currently offline, please contact in another time.');
				writeJSON('./databases/offline_db/users.json', JSON.parse(JSON.stringify(data, undefined, 2)));
			} else if (dataUser && dateNow < waitTil30Second) {
				return;
			} else if (!dataUser) {
				data.push({
					participant: sender,
					date: dayjs().valueOf(),
				});
				writeJSON('./databases/offline_db/users.json', JSON.parse(JSON.stringify(data, undefined, 2)));
				await client[botNum].reply({ from, quoted: message }, 'The owner currently offline, please contact in another time.');
			}
		} catch (err) {
			log(err);
		}
	},
};
