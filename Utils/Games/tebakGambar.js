import path from "path";
import moment from "moment-timezone";
import { __dirname } from "../../index.js";
import { readJSON, randomize, writeJSON, isFileExist, unlinkFile } from "../../Helper/Modules/functions.js";

export const startTG = async (client, id, { from, message, sender }, remainingTime) => {
	if (isFileExist(path.join(__dirname, `Helper/Games/Tebak Gambar/${id}.json`)))
		return {
			status: "playing",
			data: readJSON(path.join(__dirname, `Helper/Games/Tebak Gambar/${id}.json`)).message,
			remaining: readJSON(path.join(__dirname, `Helper/Games/Tebak Gambar/${id}.json`)).remaining,
		};
	const { img: image, jawaban: answer } = getData();
	const object = {
		id,
		startsBy: sender,
		remaining: "",
		expired: moment(new Date()).add(parseInt(remainingTime), "seconds").valueOf(),
		message: null,
		data: {
			image,
			answer,
		},
	};
	let caption = "Guess The Image!\n\n";
	caption += `You have ${remainingTime} seconds to guess the image.\n`;
	caption += `Clue : ${answer.replace(/[aiueoAIUEO]/g, "_")}\n`;
	await client[botNum].sendMessage(id, { image: { url: image }, caption }, { quoted: message }).then(async (data) => {
		pushMessageData(object, message);
	});
	var interval = setInterval(function () {
		if (!isFileExist(path.join(__dirname, `Helper/Games/Tebak Gambar/${id}.json`))) clearInterval(interval);
		const data = readJSON(path.join(__dirname, `Helper/Games/Tebak Gambar/${id}.json`));
		const count = data.expired;
		const now = new Date().getTime();
		const distance = count - now;
		const second = Math.floor((distance % (1000 * 60)) / 1000);
		{
			data.remaining = second;
			writeJSON(path.join(__dirname, `Helper/Games/Tebak Gambar/${id}.json`), data);
		}
		if (second <= 0) {
			clearInterval(interval);
			client[botNum].reply(from, `Time's up! The answer is ${answer}`);
			return unlinkFile(path.join(__dirname, `Helper/Games/Tebak Gambar/${id}.json`));
		}
	});
	return {
		status: "started",
	};
};

const pushMessageData = (data, message) => {
	writeJSON(path.join(__dirname, `Helper/Games/Tebak Gambar/${data.id}.json`), data);
	const dataAfter = readJSON(path.join(__dirname, `Helper/Games/Tebak Gambar/${data.id}.json`));
	dataAfter.message = message;
	writeJSON(path.join(__dirname, `Helper/Games/Tebak Gambar/${data.id}.json`), dataAfter);
};

const getData = () => randomize(readJSON(path.join(__dirname, "Helper/Games/Tebak Gambar/gambar.json")));
