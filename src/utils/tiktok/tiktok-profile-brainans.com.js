import { cheerioLOAD, fetchTEXT } from '../modules/index.js';

const _api = (input) => {
	if (input) {
		return `https://www.brainans.com/user/${input}`;
	}

	return 'https://www.brainans.com/user/';
};

/**
 * @typedef {{videos: {url: string, posted: string, captions: string, totalViews: string, totalComments: string, totalShare: string, totalLikes: string}[]}} VideosContainer
 * @typedef {{userName: String, fullName: string, bio: string, totalVideos: string, following: string, followers: string, likes: string, profilePicture: string} & VideosContainer} ResultContainer
 */

/**
 * Look-up TikTok user's from brainans.com
 * @param {string} username
 * @returns {Promise<ResultContainer>}
 * @throws {Error}
 */
export const tiktokProfileBRAINANS = (username) =>
	new Promise(async (resolve, reject) => {
		try {
			if (username.startsWith('@')) {
				username = username.substring(1);
			}

			const data = await fetchTEXT(_api(username), {
				headers: {
					'User-Agent':
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.88 Safari/537.36',
					Cookie:
						'_tiktok_key=SFMyNTY.g3QAAAABbQAAAAtfY3NyZl90b2tlbm0AAAAYNXVqYUNMSG45NHVvWW1XS0prNlBRZE8y.ZO2MBELa8GVyfiGsR3OlGlMDIiChcfSinC6LDhDyvBg' /*COOKIE.BRAINANS_COOKIE*/
				}
			});
			const $ = cheerioLOAD(data);
			const userName = $('div.user__title > a > h1').text();
			const fullName = $('div.user__title > h4').text();
			const bio = $('div.user__info-desc').text();
			const totalVideos = $('ul.list > li.list__item:nth-child(1) > strong').text();
			const following = $('ul.list > li.list__item:nth-child(3) > strong').text();
			const followers = $('ul.list > li.list__item:nth-child(2) > strong').text();
			const likes = $('ul.list > li.list__item:nth-child(4) > strong').text();
			const profilePicture = $('div.user.container > div > div.col-md-3.col-4.my-3 > div')
				.attr('style')
				.split("url('")[1] /* eslint-disable-line */
				.replace("');", ''); /* eslint-disable-line */
			let videos = $('div.container > div > div > div > h2').text() === 'There are no any videos' ? false : true;

			if (videos) {
				videos = [];
				$('#videos_container > div > div.content__list.grid.infinite_scroll.cards > div').each((i, element) => {
					if ($(element).find('a').attr('href') !== undefined) {
						videos.push({
							url: _api().replace('/user/', '') + $(element).find('a').attr('href'),
							posted: $(element).find('div.info-text > div > span.text.ml-1').text(),
							captions: $(element).find('div.content__text > p').text()
								? $(element).find('div.content__text > p').text()
								: 'No caption.',
							totalViews: $(element).find('a > div.video_view_count.bx.bx-show > span').text(),
							totalComments: $(element).find('div.content__btns > div:nth-child(2) > span.text.ml-1').text(),
							totalShare: $(element).find('div.content__btns > div:nth-child(3) > span.text.ml-1').text(),
							totalLikes: $(element).find('div.content__btns > div:nth-child(1) > span.text.ml-1').text()
						});
					}
				});
			} else {
				videos = [];
			}

			resolve({ userName, fullName, bio, totalVideos, following, followers, likes, profilePicture, videos });
		} catch (err) {
			reject(err);
		}
	});
