import dayjs from 'dayjs';
import fs from 'fs-extra';

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
			await client.reply(from, 'The owner is currently offline, please contact another time.', message);
		}
	} catch (err) {
		log(err);
	}
};

export default offlineHandler;
