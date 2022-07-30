import Axios from "axios";

const TYPE = {
	nsfw: ["waifu", "neko", "trap", "blowjob"],
	sfw: ["waifu", "neko", "shinobu", "megumin", "bully", "cuddle", "cry", "hug", "awoo", "kiss", "lick", "pat", "smug", "bonk", "yeet", "blush", "smile", "wave", "highfive", "handhold", "nom", "bite", "glomp", "slap", "kill", "kick", "happy", "wink", "poke", "dance", "cringe"],
};

export const getWaifu = (input = "neko", type = "sfw") =>
	new Promise(async (resolve, reject) => {
		try {
			if (!Object.keys(TYPE).includes(type)) return resolve({ error: `No data with the type : ${type}\nAvailable Type : ${Object.keys(TYPE).join(", ")}`.trim() });
			if (!TYPE[type].includes(input))
				return resolve({
					error: `No data with the input : ${input}\nCurrent option are ${type}\nList of ${type} : ${TYPE[type].join(", ")}.\n${TYPE["nsfw"].find((v) => v == input) ? `\nThis input are on nsfw section.` : TYPE["sfw"].find((v) => v == input) ? `\nThis input are on sfw section.` : ""}`.trim(),
				});
			const { data } = await Axios.post(`https://api.waifu.pics/many/${type}/${input}`, {
				headers: {
					"content-type": "application/json;charset=UTF-8",
				},
				data: { exclude: [] },
			});
			resolve(data.files);
		} catch (err) {
			reject(err);
		}
	});
