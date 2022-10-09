/* global botNum */
import moment from 'moment-timezone';
import path from 'path';

import configuration from '../../connect.js';
import { __dirname } from '../../index.js';
import { color, INFOLOG, randomize, readJSON } from '../../helper/modules/functions.js';
import { CheckIntervals, DeleteIntervals, SetIntervals } from '../misc/intervals.js';

const pushMessageData = (id, data, message) => {
	configuration.games.tebakGambar.set(id, data);
	const Data = configuration.games.tebakGambar.get(id);

	Data.message = message;
	return true;
};

const getData = () => randomize(readJSON(path.join(__dirname, 'databases/games/tebak_gambar/db.json')));

export const startTG = async (client, id, { message, sender }, remainingTime) => {
	const time = moment().format('HH:mm:ss DD/MM');
	const Data = CheckIntervals(configuration.intervals['tebakGambar'].get(id));

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
	const remainings = moment(new Date())
		.add(parseInt(remainingTime + 2), 'seconds')
		.valueOf();

	INFOLOG(`[${color(time, 'cyan')}]`, `${color(`The Answer is : ${answer.trim()}`, '#01cdfe')}`);
	SetIntervals(configuration.intervals['tebakGambar'], id, remainingTime + 2, (clients = client, ids = id, answers = answer, messages = message, remainingTimes = remainings) => {
		if (configuration.intervals['tebakGambar'].get(ids) === undefined) {
			return;
		}

		const second = Math.floor(((remainingTimes - new Date().getTime()) % (1000 * 60)) / 1000);

		configuration.intervals['tebakGambar'].get(ids).timer = second;
		configuration.games.tebakGambar.get(ids).timer = second;
		const { timer } = CheckIntervals(configuration.intervals['tebakGambar'].get(ids));

		if (timer == 5) {
			clients[botNum].reply({ from: ids, quoted: messages }, 'Time is almost over! 5 seconds');
		}

		if (timer <= 0) {
			DeleteIntervals(configuration.intervals['tebakGambar'].get(ids), configuration.intervals['tebakGambar'], ids);
			clients[botNum].reply({ from: ids, quoted: messages }, `Time's up! The answer is ${answers}`);
			configuration.games.tebakGambar.delete(configuration.games.tebakGambar.get(ids).id);
		}
	});
	return {
		status: 'started',
	};
};
