import fetch from "node-fetch";
import bigInt from "big-integer";

const INFO_URL_API = () => `https://www.instagram.com`;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36";
const sessionId = process.env.INSTAGRAM_SESI;

const lower = "abcdefghijklmnopqrstuvwxyz";
const upper = lower.toUpperCase();
const numbers = "0123456789";
const ig_alphabet = `${upper + lower + numbers}-_`;
const bigint_alphabet = numbers + lower;

export const shortcodeToMediaID = (shortcode) => {
	const o = shortcode.replace(/\S/g, (m) => {
		const c = ig_alphabet.indexOf(m);
		const b = bigint_alphabet.charAt(c);
		return b != "" ? b : `<${c}>`;
	});
	return bigInt(o, 64).toString(10);
};

export const shortcodeFormatter = (url) => {
	const re = /(?:https?:\/\/)?(?:www\.)?(?:instagram\.com(?:\/.+?)?\/(p|reel|tv)\/)([\w-]+)(?:\/)?(\?.*)?$/gim.exec(url) || "";
	return {
		type: re[1],
		shortcode: re[2],
		url: `https://www.instagram.com/${re[1]}/${re[2]}`,
		media_id: shortcodeToMediaID(re[2]),
	};
};

export const getPost = (url) =>
	new Promise(async (resolve, reject) => {
		if (!url) return reject(new Error('Argument "code" must be specified'));
		try {
			const c = `${INFO_URL_API()}/${shortcodeFormatter(url).type}/${shortcodeFormatter(url).shortcode}/?__a=1&__d=dis`;
			console.log(c);
			const data = await fetch(c, {
				method: "GET",
				headers: { "user-agent": UA, cookie: `sessionid=${sessionId};` },
			});
			let { username, full_name, is_private, is_verified } = data.items[0].user;
			let { like_count, carousel_media_count, taken_at, comment_count, media_type } = data.items[0];
			const captions = data.items[0].caption?.text ?? "No captions";
			const type = media_type == 8 ? "slide" : media_type == 2 ? "video" : "image";
			carousel_media_count = carousel_media_count ?? 1;
			let result = { username, full_name, is_private, is_verified, like_count, carousel_media_count, taken_at, comment_count, captions, post: [] };
			if (type == "slide") {
				let { carousel_media: posts } = data.items[0];
				for (const post of posts)
					if (post.media_type == 1) result.post.push({ isVideo: false, url: post.image_versions2.candidates[0].url });
					else if (post.media_type == 2) result.post.push({ isVideo: true, url: post.video_versions[0].url, duration: post.video_duration });
			} else if (type == "image") result.post.push({ isVideo: false, url: data.items[0].image_versions2.candidates[0].url });
			else if (type == "video") {
				result = { ...result, play_count: data.items[0].play_count };
				result.post.push({ isVideo: true, url: data.items[0].video_versions[0].url });
			}
			resolve(result);
		} catch (e) {
			resolve({ error: url.includes("/p/") ? e.message : "Invalid code" });
			log(e);
		}
	});
