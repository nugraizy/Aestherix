import { fetchJSON } from '../../helper/index.js';

const INFO_URL_API = (code) => `https://www.instagram.com/p/${code}/?__a=1&__d=dis`;

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36';
const sessionId = process.env.INSTAGRAM_SESI || (await (await import('./instaCookie.js')).getCookie(process.env.INSTAGRAM_USERNAME, process.env.INSTAGRAM_PASSWORD));

export const getPost = (code) =>
	new Promise(async (resolve, reject) => {
		if (!code) {
			return reject(new Error('Argument "code" must be specified'));
		}

		try {
			const FORMATTED_URL = INFO_URL_API(code);
			const data = await fetchJSON(FORMATTED_URL, {
				method: 'GET',
				headers: { 'user-agent': UA, cookie: sessionId },
			});
			let { username, full_name: fullName, is_private: isPrivate, is_verified: isVerified } = data.items[0].user;
			let { like_count: likeCount, taken_at: takenAt, comment_count: commentCount, media_type: mediaType } = data.items[0];

			const captions = data.items[0].caption?.text ?? 'No captions';
			const type = mediaType == 8 ? 'slide' : mediaType == 2 ? 'video' : 'image';

			let result = { username, fullName, isPrivate, isVerified, likeCount, takenAt, commentCount, captions, post: [] };

			if (type == 'slide') {
				let { carousel_media: posts } = data.items[0];

				for (const post of posts) {
					if (post.media_type == 1) {
						result.post.push({ isVideo: false, url: post.image_versions2.candidates[0].url });
					} else if (post.media_type == 2) {
						result.post.push({ isVideo: true, url: post.video_versions[0].url, duration: post.video_duration });
					}
				}
			} else if (type == 'image') {
				result.post.push({ isVideo: false, url: data.items[0].image_versions2.candidates[0].url });
			} else if (type == 'video') {
				result = { ...result, playCount: data.items[0].play_count };
				result.post.push({ isVideo: true, url: data.items[0].video_versions[0].url });
			}

			resolve(result);
		} catch (e) {
			resolve(e);
		}
	});
