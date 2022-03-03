import path from "path";
import moment from "moment-timezone";
import { __dirname } from "../../connect.js";
import { readJSON, randomize } from "../../Helper/Modules/functions.js";
import { CheckIntervals, DeleteIntervals, SetIntervals } from "../Misc/intervals.js";

export const startTG = async (client, id, { message, sender }, remainingTime) => {
	const Data = CheckIntervals(intervals["tebakGambar"].get(id));
	if (Data !== 0) {
		const data = games.tebakGambar.get(id);
		return { status: "playing", messages: data.message, remaining: data.timer };
	}
	const { img: image, jawaban: answer } = getData();
	const obj = { id, startsBy: sender, message: null, timer: null, data: { image, answer } };
	const caption = `Guess The Image!\n\nYou have ${remainingTime} seconds to guess the image.\nClue : ${answer.replace(/[aiueoAIUEO]/g, "_")}\n`;
	await client[botNum].sendMessage(id, { image: { url: image }, caption }, { quoted: message }).then((data) => {
		obj.message = data;
		pushMessageData(id, obj, data);
	});
	const remainings = moment(new Date())
		.add(parseInt(remainingTime + 2), "seconds")
		.valueOf();

	SetIntervals(intervals["tebakGambar"], id, remainingTime + 2, (clients = client, ids = id, answers = answer, remainingTimes = remainings) => {
		if (intervals["tebakGambar"].get(ids) === undefined) return;
		const second = Math.floor(((remainingTimes - new Date().getTime()) % (1000 * 60)) / 1000);
		intervals["tebakGambar"].get(ids).timer = second;
		games.tebakGambar.get(ids).timer = second;
		const { timer } = CheckIntervals(intervals["tebakGambar"].get(ids));
		if (timer <= 0) {
			DeleteIntervals(intervals["tebakGambar"].get(ids), intervals["tebakGambar"], ids);
			clients[botNum].reply(ids, `Time's up! The answer is ${answers}`);
			games.tebakGambar.delete(games.tebakGambar.get(ids));
		}
	});
	return {
		status: "started",
	};
};

const pushMessageData = (id, data, message) => {
	games.tebakGambar.set(id, data);
	const Data = games.tebakGambar.get(id);
	Data.message = message;
	return true;
};

const getData = () => randomize(readJSON(path.join(__dirname, "Helper/Games/Tebak Gambar/gambar.json")));
