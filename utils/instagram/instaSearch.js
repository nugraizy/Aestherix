import { fetchJSON } from '../../helper/index.js';

const sessionId = process.env.INSTAGRAM_SESI;

export const searchUser = (username) =>
	new Promise(async (resolve, reject) => {
		try {
			if (username.startsWith('@')) {
				username = username.replace('@', '');
			}

			const { users: items } = await fetchJSON(`https://www.instagram.com/web/search/topsearch/?query=${username}`, { headers: { Cookie: `sessionid=${sessionId}` } });
			const result = [];

			for (const item of items) {
				result.push({
					number: item.position + 1,
					pkId: item.user.pk,
					username: item.user.username,
					name: item.user.full_name,
					latestReel: item.user.latest_reel_media,
					isPrivate: item.user.is_private,
					isVerified: item.user.is_verified,
					pic: item.user.profile_pic_url,
				});
			}

			resolve(result);
		} catch (err) {
			reject(err);
		}
	});
