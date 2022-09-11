/* global log */
import { cheerioLOAD, fetchJSON, fetchTEXT } from '../../Helper/index.js';

const URL_BASE = (input) => `https://www.tiktok.com/${input}`;
const URL_ID_API = (input) => `https://m.tiktok.com/share/item/list?id=${input}&type=1&count=10000&minCursor=0&maxCursor=0`;
const URL_VIDEO_PAGE = (...input) => `https://www.tiktok.com/@${input[0]}/video/${input[1]}`;
const UA = () => 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36';
const parseUserInfo = async (arr) => {
	try {
		const {
			id: keyword,
			signature: biography,
			verified: isVerified,
			avatarLarger: profileHD,
			avatarMedium: profileSD,
			avatarThumb: profileLOW,
			nickname: fullName,
			uniqueId: username,
		} = arr.UserModule.users[arr.UserPage.uniqueId];
		const { followerCount: followers, followingCount: following, heart, videoCount: totalVideo } = arr.UserModule.stats[arr.UserPage.uniqueId];
		let data = await fetchJSON(URL_ID_API(keyword));

		data = data.body.itemListData.map((v) => {
			return { id: v.itemInfos.id, url: URL_VIDEO_PAGE(arr.UserPage.uniqueId, v.itemInfos.id) };
		});
		return {
			keyword,
			username,
			fullName,
			biography,
			isVerified,
			profileHD,
			profileSD,
			profileLOW,
			followers,
			following,
			heart,
			totalVideo,
			videoId: data,
		};
	} catch (err) {
		log(err);
		return { error: err.message };
	}
};

export const tiktokProfileTIKTOK = (username) =>
	new Promise(async (resolve, reject) => {
		try {
			if (!username.startsWith('@')) {
				username = `@${username.replace(/[^a-zA-Z0-9_.]/gi, '')}`;
			}

			const res = await fetchTEXT(URL_BASE(username), {
				headers: {
					'user-agent': UA(),
					cookie:
						'csrf_session_id=348df13992e0e564d8bbd93f41a1c00f; tt_csrf_token=QxO27ruj-L6HOddS82Os_poFTLnl94OdK6Fk; _tea_utm_cache_3053={%22utm_source%22:%22copy%22%2C%22utm_medium%22:%22android%22%2C%22utm_campaign%22:%22client_share%22}; _tea_utm_cache_1988={%22utm_source%22:%22copy%22%2C%22utm_medium%22:%22android%22%2C%22utm_campaign%22:%22client_share%22}; _tea_utm_cache_345918={%22utm_source%22:%22copy%22%2C%22utm_medium%22:%22android%22%2C%22utm_campaign%22:%22client_share%22}; _abck=22906F893C472C8C7A6AB32B92385C48~-1~YAAQR57YF/x4Dq6BAQAAlz0RCwitlsF21vzbZuzlKnZ0VZAX1mujuVu/MkF0AiFx8uwF35B0ni/iMON7fhMPIlMVZvx18PN45UcwZ54t9Gkm/VwOKmzL/Sg3ilSkOfWHqUOh4PAfRk4IF7WgT8Zq/7ZyQ5IaEhMc8IOk4aK/EXXPh/XC+zKujFZTB/VFOnDw0zKGZcH77Zr3TWcLwMuAR1mPR7+KIjXrArmF5bNY9t2k12xTazR3tvI949zRj+OnvREwpEKV4+Q9VUuwjVUrx8Me2emi6D1zMNCEuM59V9BOAs4+aNIg7JBlNO4v5JASC7jt39bvY7yneCnkphn+ynlN2HUukIhUXU/agV55UrI3G7MWiw0qCB88u96hXH75Jis39GoZmw==~-1~-1~-1; bm_sz=52BB5DE132A974C255392D756B74B9F4~YAAQR57YF/14Dq6BAQAAlz0RCxBPYByJBFc/d1PWoWJ/obVgH9bcyOPPer406nOaj6X1sSqtYtPxSygYRDU/1bwsB1T1o+j8obIuuVYTkmFpNi+b2h+yVJiCmNhPUHxqYWgmai5k8Qc4kLGS/yDoB3tdol78pQ/BxMLTHmGTpHi9c9u8e8HuTOExgbJS8oYxF1Ka0p8fRuHjq4QXksu233OV6dM6e3YKM0AT97meGC7s8k4KLdIicprwY+afSYZLcOpJwohIqi548lz1oUn5ZJ3vOS1fj5GRYXM8LqfnQFVNLPw=~4605505~3491384; __tea_cookie_tokens_1988=%257B%2522web_id%2522%253A%2522%2522%252C%2522timestamp%2522%253A1658043058419%257D; s_v_web_id=verify_l5p010mf_7BLO6dEl_aZGq_4y2q_9g2H_WPr6dgZkcGwX; __tea_cache_tokens_1988={%22user_unique_id%22:%227117609126503548418%22%2C%22timestamp%22:1658043058418%2C%22_type_%22:%22default%22}; ak_bmsc=DBDD5955C4149588C9CF09D3A9925E32~000000000000000000000000000000~YAAQR57YFwZ5Dq6BAQAAQYERCxC8wmv+l5gkF6FUH3/8TnxicUpUiPjoa830oYusBM7DDSKQkoh3psmYapIFcXt4oGnHGv67r+aRvOa0YrZYGQK0ggMiE8yXMVIjEr79ohKmLd6OFFFtsrZuQX2OSL5E/R/+Csvq4d7HFu0PlErFxUo/ow2KP/dMTILFca7CVD2dIz5MXJXxptkKyzZTUCYKwUvD+bJHzH2PGB9+Ya8WugederMbj3R5Wi0WA2y5ilTbc1L+asZVU7CQPgChqE2/8WoNPsmvbx9wnLQSKkXl/BQfcxx12zoIlsjXvLEOfe1kOAf+1ifrI9UsdQxyvzeFNSfGDhYjmw4B0Tt2jI5rsAy286LqgXqHG+fXTcDiQdbzr1CDuQAlCA==; bm_sv=0349A0CDED4628960B1EF72875EC23FB~YAAQN57YF0IFpseBAQAAMhozCxDRq5Biev+GbDv9kjdUIiWQvTQxJVRgfwSTY1mHbID1OOQwsPZWNs2hWt2RLM73+SV6FMVmQlV47baJPCvsBcC2h4z5K/TM0GvYWUHepSVziewXO/2P4pKJnpUSlG5sY4AdeUU4uo4hdKrI4/2EgI9RSIuvobLqFBpNDSVHV4lMqnRUFqbS5BzIcD3xojAVXsnhWGAdyiWI2rDhglYjizdI0giOc9IHOIpiYT8y~1; ttwid=1%7CtoWpGkXAE-a4TNVXBvhd06MBdJKeCMZEaW4A_pfgq-c%7C1658045308%7Cb4b636f39a8180d477a1bb8eebd614d8fc95789def4d34de61639b99a478a19e; msToken=wfsgfY1caoL6YuN9B8GmZOgv2yX5VtsyKvICoA4D4dAoKLY11EF7HVwrjsrAFsRjIOOmvCiBunGK5pntDyOfqa4RUXrSIUqk1tvPxasFtwBYczJ6HmpHkloa62Y75AfYOBylMriK2QoUbAo=; msToken=cm6If5LKeROB11ipS4Xjdz9ZFe5ZtqlbfnhTwnCExT2N911M1hQ8STLFoXTv0bRAwSkFKg78BCFGXNcYXqm2CZzR7tRDElsWzs_wocM-P76P0y6tojtiy8CAjfZneQUZmvyZ4XhMJwvNYu4=',
				},
			});
			const $ = cheerioLOAD(res);
			const data = parseUserInfo(JSON.parse($('#SIGI_STATE').html()));

			if ('error' in data) {
				resolve({ error: data.error });
			}

			resolve(data);
		} catch (err) {
			reject(err);
		}
	});
