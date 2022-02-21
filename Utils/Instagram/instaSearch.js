import Axios from "axios";
const sessionId = process.env.INSTAGRAM_SESI;

export const searchUser = (query) =>
	new Promise((resolve, reject) => {
		Axios.get(`https://www.instagram.com/web/search/topsearch/?query=${query}`, {
			headers: {
				Cookie: `sessionid=${sessionId}`,
			},
		})
			.then(({ data: { users: all } }) => {
				const result = [];
				for (let i = 0; i < all.length; i++) {
					result.push({
						number: all[i].position + 1,
						pk_id: all[i].user.pk,
						username: all[i].user.username,
						name: all[i].user.full_name,
						latest_reel: all[i].user.latest_reel_media,
						is_private: all[i].user.is_private,
						is_verified: all[i].user.is_verified,
						pic: all[i].user.profile_pic_url,
					});
				}
				resolve(result);
			})
			.catch((_) => reject({ error: _ }));
	});
