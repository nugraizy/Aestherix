/* global botNum */
import dayjs from 'dayjs';
import path from 'path';

import configuration from '../../connect.js';
import { __dirname } from '../../index.js';
import { color, INFOLOG, randomize, readJSON } from '../../helper/modules/functions.js';
import { checkIntervals, deleteIntervals, setIntervals } from '../misc/intervals.js';

const pushMessageData = (id, data, message) => {
	configuration.games.tebakGambar.set(id, data);
	const Data = configuration.games.tebakGambar.get(id);

	Data.message = message;
	return true;
};

const getData = () => randomize(readJSON(path.join(__dirname, 'databases/games/tebak_gambar/db.json')));

export const startTG = async (client, id, { message, sender }, remainingTime) => {
	const time = dayjs().format('HH:mm:ss DD/MM');
	const Data = checkIntervals(configuration.intervals.tebakGambar.get(id));

	if (Data !== 0) {
		const data = configuration.games.tebakGambar.get(id);

		return { status: 'playing', messages: data.message, remaining: data.timer };
	}

	const { image, answer } = getData();
	const obj = { id, startsBy: sender, message: null, timer: null, data: { image, answer: answer.trim() } };
	const caption = `Guess The Image!\n\nYou have ${remainingTime} seconds to guess the image.\nClue : ${answer.replace(/[aiueoAIUEO]/g, '_')}\n`;

	await client[botNum].sendMessage(id, { image: { url: image }, caption }, { quoted: message }).then((data) => {
		obj.message = data;
		pushMessageData(id, obj, data);
	});
	const remainings = dayjs(new Date())
		.add(remainingTime + 2, 's')
		.valueOf();

	INFOLOG(`[${color(time, 'cyan')}]`, `${color(`The Answer is : ${answer.trim()}`, '#01cdfe')}`);
	setIntervals(configuration.intervals.tebakGambar, id, remainingTime + 2, (clients = client, ids = id, answers = answer, messages = message, remainingTimes = remainings) => {
		if (configuration.intervals.tebakGambar.get(ids) === undefined) {
			return;
		}

		const second = Math.floor(((remainingTimes - new Date().getTime()) % (1000 * 60)) / 1000);

		configuration.intervals.tebakGambar.get(ids).timer = second;
		configuration.games.tebakGambar.get(ids).timer = second;
		const { timer } = checkIntervals(configuration.intervals.tebakGambar.get(ids));

		if (timer == 5) {
			clients[botNum].reply({ from: ids, quoted: messages }, 'Time is almost over! 5 seconds');
		}

		if (timer <= 0) {
			deleteIntervals(configuration.intervals.tebakGambar.get(ids), configuration.intervals.tebakGambar, ids);
			clients[botNum].reply({ from: ids, quoted: messages }, `Time's up! The answer is ${answers}`);
			configuration.games.tebakGambar.delete(configuration.games.tebakGambar.get(ids).id);
		}
	});
	return {
		status: 'started',
	};
};
