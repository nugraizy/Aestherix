import fetch from "node-fetch";
import { getUser } from "./index.js";

const URL_BASE = (input) => `https://i.instagram.com/api/v1/feed/user/${input}/reel_media/`;
const UA_IP = "Instagram 123.0.0.21.114 (iPhone; CPU iPhone OS 11_4 like Mac OS X; en_US; en-US; scale=2.00; 750x1334) AppleWebKit/605.1.15";
const sessionId = process.env.INSTAGRAM_SESI;

export const getStory3 = (username) =>
	new Promise(async (resolve, reject) => {
		if (username.startsWith("@")) username = username.replace("@", "");
		try {
			const { id, fullName, username } = await getUser(username);
			const data = await (await fetch(URL_BASE(id), { method: "GET", headers: { "user-agent": UA_IP, cookie: `sessionid=${sessionId};` } })).json();
			const result = { username, fullName, totalStories: data.media_count, stories: [] };
			for (const item of data.items)
				if (item.media_type == 1) result.stories.push({ isVideo: false, url: item.image_versions2.candidates[0].url });
				else if (item.media_type == 2) result.stories.push({ isVideo: true, url: item.video_versions[0].url, duration: item.video_duration });
			resolve(result);
		} catch (err) {
			reject({ error: err });
		}
	});
