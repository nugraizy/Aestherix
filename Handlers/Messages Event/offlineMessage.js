/* global botNum, log */
import moment from 'moment-timezone';

import { isFileExist, readJSON, writeJSON } from '../../Helper/Modules/index.js';

export default {
	async handler(client, { isGroup, from, sender, message }) {
		try {
			if (isGroup) {
				return;
			}

			if (!isFileExist('./Databases/Offline DB/users.json')) {
				writeJSON('./Databases/Offline DB/users.json', []);
			}

			const data = readJSON('./Databases/Offline DB/users.json');

			if (data.length == 0) {
				data.push({
					participant: sender,
					date: moment().valueOf(),
				});
				writeJSON('./Databases/Offline DB/users.json', JSON.parse(JSON.stringify(data, undefined, 2)));
				await client[botNum].reply({ from, quoted: message }, 'The owner currently offline, please contact in another time.');
				return;
			}

			const dataUser = data.find((v) => v.participant == sender);
			const dateOff = dataUser ? dataUser.date : 0;
			const waitTil30Second = dataUser ? moment(dateOff).add(parseInt('30'), 'seconds').valueOf() : 0;
			const dateNow = moment().valueOf();

			if (dataUser && dateNow > waitTil30Second) {
				dataUser.date = moment().valueOf();
				await client[botNum].reply({ from, quoted: message }, 'The owner currently offline, please contact in another time.');
				writeJSON('./Databases/Offline DB/users.json', JSON.parse(JSON.stringify(data, undefined, 2)));
			} else if (dataUser && dateNow < waitTil30Second) {
				return;
			} else if (!dataUser) {
				data.push({
					participant: sender,
					date: moment().valueOf(),
				});
				writeJSON('./Databases/Offline DB/users.json', JSON.parse(JSON.stringify(data, undefined, 2)));
				await client[botNum].reply({ from, quoted: message }, 'The owner currently offline, please contact in another time.');
			}
		} catch (err) {
			log(err);
		}
	},
};
