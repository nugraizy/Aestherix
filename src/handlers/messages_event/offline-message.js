import dayjs from 'dayjs';
import fs from 'fs-extra';

const handler = async (client, { isGroup, from, sender, message }) => {
	try {
		if (isGroup) {
			return;
		}

		if (!(await fs.exists('./databases/offline_db/users.json'))) {
			await fs.writeJSON('./databases/offline_db/users.json', []);
		}

		const data = await fs.readJSON('./databases/offline_db/users.json');

		if (data.length === 0) {
			data.push({
				participant: sender,
				date: dayjs().valueOf()
			});
			await fs.writeJSON('./databases/offline_db/users.json', JSON.parse(JSON.stringify(data, undefined, 2)));
			await client[botNum].reply({ from, quoted: message }, 'The owner currently offline, please contact in another time.');
			return;
		}

		const dataUser = data.find((v) => v.participant === sender);
		const dateOff = dataUser ? dataUser.date : 0;
		const waitTil30Second = dataUser ? dayjs(dateOff).add(30, 's').valueOf() : 0;
		const dateNow = dayjs().valueOf();

		if (!dataUser) {
			data.push({
				participant: sender,
				date: dayjs().valueOf()
			});
		} else if (dateNow > waitTil30Second) {
			dataUser.date = dayjs().valueOf();
		} else {
			return;
		}

		await client[botNum].reply({ from, quoted: message }, 'The owner is currently offline, please contact another time.');
		await fs.writeJSON('./databases/offline_db/users.json', JSON.stringify(data, null, 2));
	} catch (err) {
		log(err);
	}
};

const offlineHandler = handler;

export default offlineHandler;
