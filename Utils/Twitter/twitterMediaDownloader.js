import { fetchJSON, fetchTEXT } from "../../Helper/index.js";

export const twitterDownload = (input) =>
	new Promise(async (resolve) => {
		if (!regex(input)) {
			return resolve({ error: "This is not a valid Twitter URL." });
		}
		const { id } = regex(input);
		try {
			let container = {};
			const data = await fetchTEXT(URL_API_DOWNLOAD(id), { headers: { cookie: "_fbp=fb.1.1657783842199.544637810" } });
			if (data == "") {
				return resolve({ error: "Something went wrong with the URL." });
			}
			const { name, username, verified, text, created_at, like_count, retweet_count, reply_count, media: medias } = JSON.parse(data);
			container = { author: name, username, verified, caption: text, published: created_at, liked: like_count, retweet: retweet_count, replies: reply_count, medias: [] };
			for (const media of medias) {
				if (media.type == "photo") {
					container.medias.push({
						url: media.url,
						type: "image",
					});
					continue;
				}
				const data = await fetchJSON(URL_API_DOWNLOAD(`${id}/video`), { headers: { cookie: "_fbp=fb.1.1657783842199.544637810" } });
				container.medias.push({
					url: data.variants.slice(-1)[0].url,
					type: "video",
				});
			}
			resolve(container);
		} catch (err) {
			log(err);
			resolve({ error: err.message });
		}
	});

const regex = (input) => {
	const regex = /twitter\.com\/.*\/status(?:es)?\/([^\/\?]+)/.test(input) ? input.match(/twitter\.com\/.*\/status(?:es)?\/([^\/\?]+)/gm)?.[0]?.match(/[0-9]{19,20}/g)?.[0] : false;
	if (!regex) {
		return false;
	}
	return {
		id: regex,
		url: input,
	};
};

const URL_API_DOWNLOAD = (input) => `https://tweetpik.com/api/tweets/${input}`;
