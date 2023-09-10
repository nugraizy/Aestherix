import { randomChar } from '../modules/index.js';
import { COOKIE } from './cookie.js';

export const _apiBase = (input) => `https://www.tiktok.com/${input}`;
const _apiBaseVideo = (...input) => _apiBase(`@${input[0]}/video/${input[1]}`);

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

/**
 * @typedef {{keyword: string, username: string, fullName: string, biography: string, isVerified: boolean, profileHD: string, profileSD: string}} ParsedContainer
 * @typedef {{videoId: {id: string, url: string}[]}} VideosContainer
 * @typedef {ParsedContainer & VideosContainer & {profileLOW: string, followers: number, following: number, heart: number, totalVideo: number}} ResultContainer
 */
export const parseUserInfo = async (arr) => {
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

export const parseCrawlerResponse = (dataPosts, dataUsers) => {
	const container = {};

	const { author, author_user_id } = dataPosts.aweme_list[0]; // eslint-disable-line

	const { avatarLarger, signature, verified, bioLink, privateAccount } = dataUsers.UserModule.users[author.nickname];
	const [x, y] = avatarLarger.match(/(\d+)x(\d+)/gi)?.[0]?.split('x') || [0, 0];

	container.author = {
		id: author_user_id, // eslint-disable-line
		username: author.unique_id,
		nickname: author.nickname,
		...(author.ins_id ? { instagram: author.ins_id } : {}),
		region: author.region,
		bio: signature,
		verified,
		private: privateAccount,
		statistics: {
			follower: author.follower_count,
			following: author.following_count,
			favorite: author.total_favorited
		}
	};

	container.urls = {};

	container.urls.avatar = {
		url: avatarLarger,
		dimension: {
			x,
			y
		}
	};

	container.urls.externalUrls /* eslint-disable-line */ = {
		url: bioLink.link
	};

	container.urls.posts = dataPosts.aweme_list.map((v) => {
		const { music, share_url, statistics, status, video, video_control } = v; // eslint-disable-line

		return {
			statistic: {
				comment: statistics.comment_count,
				like: statistics.digg_count,
				download: statistics.download_count,
				repost: statistics.forward_count,
				share: statistics.share_count,
				views: statistics.play_count
			},
			status: {
				comment: status.allow_comment,
				share: status.allow_share,
				download: video_control.allow_download, // eslint-disable-line
				duet: video_control.allow_duet, // eslint-disable-line
				music: video_control.allow_music, // eslint-disable-line
				reacts: video_control.allow_react, // eslint-disable-line
				stitch: video_control.allow_stitch // eslint-disable-line
			},
			music: {
				username: music.owner_handle,
				nickname: music.owner_nickname,
				duration: music.duration,
				title: music.title,
				verfiedArtist: music.is_author_artist,
				originalMusic: music.is_original_sound,
				urls: {
					avatar: music.avatar_thumb.url_list.find((v) => v.includes('.jpeg')),
					cover: music.cover_large.url_list.find((v) => v.includes('.jpeg')),
					musicUrl: music.play_url.url_list[0]
				}
			},
			video: {
				urls: {
					cover: {
						static: video.cover.url_list[0],
						animated: video.animated_cover.url_list[0]
					},
					video: {
						withWatermark: { size: video.download_addr.data_size, url: video.download_addr.url_list[0] },
						withoutWatermark: { size: video.play_addr.data_size, url: video.play_addr.url_list[0] }
					}
				}
			},
			urls: {
				shareUrl: share_url // eslint-disable-line
			}
		};
	});

	return container;
};
