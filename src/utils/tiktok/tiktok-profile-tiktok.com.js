import got from 'got';
import { cheerioLOAD } from '../modules/index.js';

const _apiBase = (input) => `https://www.tiktok.com/${input}`;
const _apiBaseVideo = (...input) => _apiBase(`@${input[0]}/video/${input[1]}`);

/**
 * @typedef {{keyword: string, username: string, fullName: string, biography: string, isVerified: boolean, profileHD: string, profileSD: string}} ParsedContainer
 * @typedef {{videoId: {id: string, url: string}[]}} VideosContainer
 * @typedef {ParsedContainer & VideosContainer & {profileLOW: string, followers: number, following: number, heart: number, totalVideo: number}} ResultContainer
 */
const parseUserInfo = async (arr) => {
	try {
		if (!arr.UserModule) {
			return { error: 'User not found' };
		}

		const {
			id: keyword,
			signature: biography,
			verified: isVerified,
			avatarLarger: profileHD,
			avatarMedium: profileSD,
			avatarThumb: profileLOW,
			nickname: fullName,
			uniqueId: username
		} = arr.UserModule.users[arr.UserPage.uniqueId];
		const {
			followerCount: followers,
			followingCount: following,
			heart,
			videoCount: totalVideo
		} = arr.UserModule.stats[arr.UserPage.uniqueId];

		const data =
			Object.keys(arr?.ItemModule || []).length === 0
				? []
				: Object.values(arr.ItemModule).map((v) => ({
						id: v.id,
						uploaded: Number(v.createTime),
						liked: v.stats.diggCount,
						shared: v.stats.shareCount,
						comment: v.stats.commentCount,
						view: v.stats.playCount,
						duration: v.video.duration,
						ratio: v.video.ratio,
						width: v.video.width,
						height: v.video.height,
						url: {
							sourceUrl: _apiBaseVideo(arr.UserPage.uniqueId, v.id),
							music: {
								title: v.music.title,
								author: v.music.authorName,
								duration: v.music.duration,
								album: v.music.album || 'single',
								url: v.music.playUrl,
								[v.music?.coverHd ? 'coverHd' : v.music?.coverLarge ? 'coverLarge' : 'coverMedium']:
									v.music.coverHd || v.music.coverLarge || v.music.coverMedium
							}
						}
				  })); /* eslint-disable-line */

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
			posts: data
		};
	} catch (err) {
		console.log(err);
		return { error: err.message };
	}
};

/**
 * Look-up TikTok user's from Official TikTok API.
 * @param {string} username
 * @returns {Promise<ResultContainer & {error?: string}>}
 * @throws {Error}
 */
export const tiktokProfileTIKTOK = (username) =>
	new Promise(async (resolve, reject) => {
		try {
			if (!username.startsWith('@')) {
				username = `@${username.replace(/[^a-zA-Z0-9_.]/gi, '')}`;
			}

			const res = await got(_apiBase(username), {
				http2: true,
				headers: {
					'user-agent':
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36',
					cookie:
						'tt_csrf_token=rnilmZq1-B7Qzbi2LFZWXUtvwo6wUqvbxXXM; tiktok_webapp_theme=light; csrf_session_id=438868e5d6992b7098ca485e6f1f71ff; _tea_utm_cache_3053={"utm_source":"more","utm_medium":"android","utm_campaign":"client_share"}; s_v_web_id=verify_lbqr9jv2_HJT2HbR1_h9Wf_4TmD_ABm9_laYe1gbl6bqs; passport_fe_beating_status=true; tt_chain_token=Znm+At8/ELjBLJBbFPJ1eg==; _abck=18CA70181BACEFC30479C7E964069ECB~0~YAAQd6s0F35nH3OGAQAA85zbeAmZ38OZ3cTNXfQMMfI7Rv5IcsWkXbVCBaoPqJmJcPlFgo90huh/6cwE2YOSGqk+GCzye8MT25qrLpoLGvdviPG24wtbYwwt8cBXVWdN0MejDQy3U2Aya1baGaG9gEGopJWYXC+MZMajLjJcFf5mwtkwiVV0vGCvalLvQGEIt5rHrOmumLSuIbPv3saTgN4Ss4wT4Mnt0oHzFG67mfWpUCJxKWX1wTDsX6rOtYgtupxlBgcdYrFfMaEfyoXay4rE9UgrDGIxdaf9/UookQSN3Tka6Eduuj48ebTbgL477VEMos9qSRbUUObxnv+w7bDNQLILDGxeK0y0gRwXDhkRsNeyBsz+dXmdttJTzJfe1LCRMFqeSLr/x+g1A5kNCin4sg3gzCA=~-1~-1~-1; bm_sz=A1B3372661EB5E49C58792E74C5BF7EF~YAAQd6s0F4FnH3OGAQAA85zbeBIiF7bi7YI6erlMBZddleQePAimRc6c0qhctkQ3ANfc0IRlgeNVrcUPD4YWf8WwgNXGbcZlH2Xer51hECyRoCYyvzCuX2FeQP3uyUvS46R+pPQ0kfSeglnpiX8PmLSY4yQJnc1VjCe4wRagYG0so8o/RfLokAEj7MQD9nTO13AG2/Qeo36qxh11TuJB/skjBMH/JRfmo3D6yMQGV5oaf1nKfipmngtmLhvlaF40T+tw1cASVJqABlOn8M4X2wMZ2340LvE9e0LUSheFmC0TkC0=~3487282~3618100; __tea_cache_tokens_1988={"_type_":"default","user_unique_id":"7177355450844857857","timestamp":1671108307651}; ak_bmsc=05728369ED84D4BC5BD854EBA2CDA66A~000000000000000000000000000000~YAAQd6s0F5hnH3OGAQAAE7rbeBKdykKwDgZw/3PO4Mtvem6gq3H37RBTurad8RHaSz7Se+mEbEgg4pX57aK5R9e1/TshX49VCLFvrNkaFTEY+/WZ3pWatmt2vqdBbf1kx1C1Wb34nWV5wDYIVQ7g+tYUg63fj+jX+XOhiuuhrbN/keFCsO4bhJvfE0KRl+N2hEF3qMnMhCtaX9XvM7GKUGo0ynSh9fS86FLK8ckR1Bb6R++81y8mNFr38NR4hH3ATbO119Ie67c2lL5YlBEXH6TJr7KFEOLJQRMT7jwrm4kXV7GTAynotz1w88NftqC55aTfyA8IUSd7q98+93ercNJn7baoWQC1lsmxCAqwhXSWdvhCgaOqzNQb8BQXUtB6Qu9YRPDXiwqdFdrBxDzt20Y52dLibHBL4UZQB5/zRWw3KxEM81gxrfwu0PdtEBQtevspG3c/JsWeBUQaXT7EG63q745gIJ/wmaYV5VJNgyljpAReEImaRps=; ttwid=1|AsvH48d0XoAtAMzp2tm7k_j765J3ar7Nrp76zGH2CuI|1677064913|dcc58a594f45eb25fbbf1121a06e10e0ba0e6bd6916ec6691d9745c0d187d3e2; passport_csrf_token=c9651411e7e34be912eb0317dcb8d222; passport_csrf_token_default=c9651411e7e34be912eb0317dcb8d222; bm_sv=55A70185E9DFE1BBAAFB8FAE3CB0EF0E~YAAQd6s0F7xnH3OGAQAA6djbeBK9B7SC3QtNT7gx+/uyg8DsMmFFmiF9AY4teETBUW05C/8NO+kYUFSZymBQFaMfCOzh+wp7iF3lZdxmHUAZsLJ3VoqxlDIseyZvzlLg0WhXb+p1K9a0rgerUoaS8OIWcmNx2EnOn6jTC09rNn38XRP5a+bQ14goc1ssZITBCjDaw0PYvM4/smo89vKTg1V0Fv/v8HO5jZ45Q+FJc+JaSJSfIz2ZMVrngXmyOeDe~1; msToken=05RjCHZD3E_lqVtLqTNKkXEai2zZZpAvbYedkcTJeQRiLUMbX2Xy6GpCzkhMGG5Mx7N54e9OjAG9x_BH7XsJiuXIrWNpjTrgbqekbpSorVFz8akOrKXIUQpNYUgH5-P1wzZzWZGuADxJLWvC; cmpl_token=AgQQAPPdF-RO0o5iJXcaOR07-fqP8vXNf4MrYMnnHg; sid_guard=46a98cca78b3b082d53b6217d6f302b4|1677064945|5184000|Sun,+23-Apr-2023+11:22:25+GMT; uid_tt=52382197069737729197ea45ee067092afc679915711177a99a18f2ab4966c5e; uid_tt_ss=52382197069737729197ea45ee067092afc679915711177a99a18f2ab4966c5e; sid_tt=46a98cca78b3b082d53b6217d6f302b4; sessionid=46a98cca78b3b082d53b6217d6f302b4; sessionid_ss=46a98cca78b3b082d53b6217d6f302b4; sid_ucp_v1=1.0.0-KGM2NjdjNmUzNTI5YTA2ZDFkZTMyNzE5YmNmN2IwNTFiMDdhNGQ5ZWQKIAiCiK-Qifqyrl4Q8fXXnwYYswsgDDD9mPPyBTgHQPQHEAMaBm1hbGl2YSIgNDZhOThjY2E3OGIzYjA4MmQ1M2I2MjE3ZDZmMzAyYjQ; ssid_ucp_v1=1.0.0-KGM2NjdjNmUzNTI5YTA2ZDFkZTMyNzE5YmNmN2IwNTFiMDdhNGQ5ZWQKIAiCiK-Qifqyrl4Q8fXXnwYYswsgDDD9mPPyBTgHQPQHEAMaBm1hbGl2YSIgNDZhOThjY2E3OGIzYjA4MmQ1M2I2MjE3ZDZmMzAyYjQ; store-idc=useast2a; store-country-code=id; store-country-code-src=uid; tt-target-idc=alisg; tt-target-idc-sign=pj1nkp4fK5Arllt8m_N3oV3UH6wu8EWF10GOnv8BzjMOxRo0ns5qspRVEK_8Jd1BI5DIswk2PIrWnRg2wB_dvpNYOElNvIEaXWNHhnQ-H3ClMsPYgc3tCqcbGeVRs2G4gOrF4-_UoARpdFxrSsJgu-KINbcHTmLW5FcaoYMD-KVUXZL3xxxImCLxAe8D9fGhtvaheLN9SmOnASK1LyAsJzk5zrEMoVgBJhMyrUb6OsRsvUDvgFchoyP9mNNM7P6OcskcXLI528nmmJgP9NkYzI27pfkOXFAQHTeWf4YxC64QRk04n8IUS0-9JjxKb7za7TQ5f3LZj0B_ovpUWoehfMwQoP1j4cBwAip4jKUEgD157VHWqHM5phtSvIU6bJJ-9e5zzIcQKnBjFBI0L0IY5giB7PvV_vkvQ0B0dmEwUN6-aZVaMSsNA4Yd4GERI21GT704r-WTfpewdOx5Zx38IcSfQx5QJIHQDsvcF_cKT7fBf0qZKMTRYI4nKJTTTMxD; msToken=zJ1zb_6EWRZxTkZWP-_mZCoCMZL1zqDLoZ7061N_FLD15xWerKCo8mhdVj9vi9fVixRjxY04BqbxEhIMrkYZm3CsmAG8-t_jGT2CjfZYNn9oIhnYGI17fMcOpbtN-te5AHv4iAf9a_1n1jF-; odin_tt=ff0436354b98716cfdc178074c6abf320e4396386f1b0de82c3952c0d317da482ad09624397b279ce67f603c36ce4942d9792dd55fcf165aa630e0a4370ddf9dabdaa2bd49b48eee6563b7b9d3b86ae5'
				},
				throwHttpErrors: false
			});
			const $ = cheerioLOAD(res.body);
			const data = parseUserInfo(JSON.parse($('#SIGI_STATE').html()));

			if ('error' in data) {
				resolve({ error: data.error });
			}

			resolve(data);
		} catch (err) {
			reject(err);
		}
	});
