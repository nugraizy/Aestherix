import dayjs from 'dayjs';
import fs from 'fs-extra';

import configuration from '../../helper/config/connect.js';
import { color, loggers, randomize } from '../modules/index.js';
import { checkIntervals, deleteIntervals, setIntervals } from '../misc/intervals.js';

const pushMessageData = (id, data, message) => {
	configuration.games.tebakGambar.set(id, data);
	const Data = configuration.games.tebakGambar.get(id);

	Data.message = message;
	return true;
};

const images = await fs.readJSON('./databases/games/tebak_gambar/db.json');
const getData = () => randomize(images);

export const startTG = async (client, id, { message, sender }, remainingTime) => {
	const Data = checkIntervals(configuration.timers.tebakGambar.get(id));

	if (Data !== 0) {
		const data = configuration.games.tebakGambar.get(id);

		return { status: 'playing', messages: data.message, remaining: data.timer };
	}

	const { image, answer } = getData();
	const obj = { id, startsBy: sender, message: null, timer: null, data: { image, answer: answer.trim() } };
	const caption = `Guess The Image!\n\nYou have ${remainingTime} seconds to guess the image.\nClue : ${answer.replace(
		/[aiueoAIUEO]/g,
		'_'
	)}\n`;

	await client.send(id, { image: { url: image }, caption }, { quoted: message }).then((data) => {
		obj.message = data;
		pushMessageData(id, obj, data);
	});
	const remainings = dayjs(new Date())
		.add(remainingTime + 2, 's')
		.valueOf();

	loggers.info(`${color(`The Answer is : ${answer.trim()}`, '#FF99C8')}`);
	setIntervals(
		configuration.timers.tebakGambar,
		id,
		remainingTime + 2,
		(clients = client, ids = id, answers = answer, messages = message, remainingTimes = remainings) => {
			if (configuration.timers.tebakGambar.get(ids) === undefined) {
				return;
			}

			const second = Math.floor(((remainingTimes - new Date().getTime()) % (1000 * 60)) / 1000);

			configuration.timers.tebakGambar.get(ids).timer = second;
			configuration.games.tebakGambar.get(ids).timer = second;
			const { timer } = checkIntervals(configuration.timers.tebakGambar.get(ids));

			if (timer === 5) {
				clients.instance.reply(ids, 'Time is almost over! 5 seconds', messages);
			}

			if (timer <= 0) {
				deleteIntervals(configuration.timers.tebakGambar.get(ids), configuration.timers.tebakGambar, ids);
				clients.instance.reply(ids, `Time's up! The answer is ${answers}`, messages);
				configuration.games.tebakGambar.delete(configuration.games.tebakGambar.get(ids).id);
			}
		}
	);
	return {
		status: 'started'
	};
};
