import { fetchJSON } from "../../Helper/index.js";
import { getUser } from "./index.js";

const URL_BASE = (input) => `https://i.instagram.com/api/v1/feed/user/${input}/reel_media/`;
const UA_IP = "Instagram 123.0.0.21.114 (iPhone; CPU iPhone OS 11_4 like Mac OS X; en_US; en-US; scale=2.00; 750x1334) AppleWebKit/605.1.15";
const sessionId = process.env.INSTAGRAM_SESI;

export const getStory3 = (input) =>
	new Promise(async (resolve, reject) => {
		const tempURL = input;
		if (input.startsWith("@")) input = input.replace("@", "");
		if (regex(input)) input = new URL(input);
		try {
			const idStory = regex(tempURL) ? input.pathname.split("/").filter((v) => v)[2] : input;
			let username = regex(tempURL) ? input.pathname.split("/").filter((v) => v)[1] : input;
			let id;
			let fullName;
			const _ = await getUser(username);
			id = _.id;
			fullName = _.fullName;
			username = _.username;
			const data = await fetchJSON(URL_BASE(id), { method: "GET", headers: { "user-agent": UA_IP, cookie: `${sessionId};` } });
			const result = { username, fullName, totalStories: data.media_count, stories: [] };
			for (const item of data.items) {
				if (regex(tempURL) && item.id.split("_")[0] === idStory) {
					if (item.media_type == 1) result.stories.push({ isVideo: false, id: item.id.split("_")[0], url: item.image_versions2.candidates[0].url });
					else if (item.media_type == 2) result.stories.push({ isVideo: true, url: item.video_versions[0].url, duration: item.video_duration });
					break;
				} else if (!regex(tempURL)) {
					if (item.media_type == 1) result.stories.push({ isVideo: false, id: item.id.split("_")[0], url: item.image_versions2.candidates[0].url });
					else if (item.media_type == 2) result.stories.push({ isVideo: true, url: item.video_versions[0].url, duration: item.video_duration });
				}
			}
			resolve(result);
		} catch (err) {
			reject(err);
		}
	});

const regex = (input) => /\/stories\//.test(input);
