const sessionId = process.env.INSTAGRAM_SESI;

export const searchUser = (username) =>
	new Promise(async (resolve, reject) => {
		try {
			if (username.startsWith("@")) username = username.replace("@", "");
			const { users: items } = await fetchJSON(`https://www.instagram.com/web/search/topsearch/?query=${username}`, { headers: { Cookie: `sessionid=${sessionId}` } });
			const result = [];
			for (const item of items) result.push({ number: item.position + 1, pk_id: item.user.pk, username: item.user.username, name: item.user.full_name, latest_reel: item.user.latest_reel_media, is_private: item.user.is_private, is_verified: item.user.is_verified, pic: item.user.profile_pic_url });
			resolve(result);
		} catch (err) {
			reject({ error: err });
		}
	});
