import { URL_API_DOWNLOAD } from "./api.js";

export const downloadDeviantArt = (input) =>
	new Promise(async (resolve, reject) => {
		try {
			const data = await fetchJSON(URL_API_DOWNLOAD(input));
			if ("error" in data) return resolve({ error: `Type : ${data.error}\nMessage : ${data.errorDescription}` });
			const { deviation } = data;
			const image = `${deviation.media.baseUri}${deviation.media.types[check(deviation.media.types.findIndex((w) => w.t == "fullview" && w.c != undefined)) ?? deviation.media.types.findIndex((w) => w.t == "social_preview")].c?.replace("<prettyName>", deviation.media.prettyName)}${
				deviation.media.token?.[0] ? `?token=${deviation.media.token[0]}` : ""
			}`;
			resolve({
				id: deviation.deviationId,
				title: deviation.title,
				author: deviation.author.username,
				favourites: deviation.stats.favourites,
				views: deviation.stats.views,
				source: deviation.url,
				image,
			});
		} catch (err) {
			log(err);
			reject(err);
		}
	});

const check = (i) => (i == -1 ? undefined : i);
