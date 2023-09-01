import { randomChar } from '../modules/index.js';
import { COOKIE } from './cookie.js';

export const buildHead = (args) => {
	return {
		/* eslint-disable */
		headers: {
			'User-Agent':
				'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 YaBrowser/23.1.5.750 (beta) Yowser/2.5 Safari/537.36',
			Cookie: COOKIE.TIKTOK_COOKIE
		},
		params: {
			...args,
			version_name: '1.1.9',
			version_code: '119',
			build_number: '1.1.9',
			manifest_version_code: '119',
			update_version_code: '119',
			openudid: randomChar('0123456789abcdef', 16),
			uuid: randomChar('1234567890', 16),
			_rticket: Date.now() * 1000,
			ts: Date.now(),
			device_brand: 'Google',
			device_type: 'Pixel 4',
			device_platform: 'android',
			resolution: '1080*1920',
			dpi: 420,
			os_version: '10',
			os_api: '29',
			carrier_region: 'US',
			sys_region: 'US',
			region: 'US',
			app_name: 'trill',
			app_language: 'en',
			language: 'en',
			timezone_name: 'America/New_York',
			timezone_offset: '-14400',
			channel: 'googleplay',
			ac: 'wifi',
			mcc_mnc: '310260',
			is_my_cn: 0,
			aid: 1180,
			ssmix: 'a',
			as: 'a1qwert123',
			cp: 'cbfhckdckkde1'
		}
		/* eslint-enable */
	};
};

export const parseData = async (obj, type) => {
	let {
		desc: videoDescription,
		create_time: published,
		author,

		statistics: {
			digg_count: liked,
			share_count: shared,
			comment_count: comment,
			play_count: view,
			download_count: downloaded
		},

		author: {
			region: locationCreated,
			avatar_medium: { url_list: avatarList }
		},

		video: {
			download_addr: { url_list: withWatermarkList },
			play_addr: { url_list: noWatermarkList },
			duration: videoDuration,
			ratio,
			cover: { url_list: videoThumbnailList }
		},

		music: {
			title: musicTitle,
			author: authorMusic,
			play_url: { url_list: musicList },
			duration: musicDuration
		}
	} = obj;

	const musicCoverList =
		obj.music[obj.music?.cover_hd ? 'cover_hd' : obj.music?.cover_large ? 'cover_large' : 'cover_medium'].url_list;

	const images = obj?.image_post_info?.images;

	const [profilePicture, musicCoverPicture, music, withNoWatermark, withWatermark, videoThumbnail] = [
		avatarList[0],
		musicCoverList[0],
		musicList[0],
		noWatermarkList[0],
		withWatermarkList[0],
		videoThumbnailList[0]
	];
	const { signature: biograph, custom_verify: verified, nickname } = author;

	return {
		keyword: obj?.aweme_id,
		author: author.unique_id,
		uniqueId: author.uid,
		nickname,
		type: type ? type : 'video',
		biograph: biograph || 'No bio yet.',
		verified: verified !== '',
		liked,
		shared,
		comment,
		view,
		downloaded,
		videoDescription,
		published,
		locationCreated,
		musicTitle,
		authorMusic,
		videoDuration,
		musicDuration,
		ratio,
		url: {
			profilePicture,
			videoThumbnail,
			music,
			musicCoverPicture,
			...(type === 'images'
				? {
						images: images.map((v, i) => ({
							url: v.display_image.url_list[1],
							index: i + 1
						}))
				  } /* eslint-disable-line */
				: { withWatermark, withNoWatermark })
		}
	};
};
