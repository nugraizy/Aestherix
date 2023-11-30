import { fetchJSON } from '../modules/index.js';

// const _apiV2 = (input) =>
// 	`https://api.twitter.com/2/tweets/${input}?expansions=attachments.media_keys,author_id,entities.mentions.username&media.fields=duration_ms,height,preview_image_url,public_metrics,type,url,width,alt_text,variants&tweet.fields=public_metrics,attachments,source,created_at&user.fields=username`;

// const _apiV1 = (input) => `https://api.twitterpicker.com/tweet/datav3?id=${input}`;

const _apiV3 = (input) =>
	`https://cdn.syndication.twimg.com/tweet-result?features=tfw_timeline_list:;tfw_follower_count_sunset:true;tfw_tweet_edit_backend:on;tfw_refsrc_session:on;tfw_fosnr_soft_interventions_enabled:on;tfw_mixed_media_15897:treatment;tfw_experiments_cookie_expiration:1209600;tfw_show_birdwatch_pivots_enabled:on;tfw_duplicate_scribes_to_settings:on;tfw_use_profile_image_shape_enabled:on;tfw_video_hls_dynamic_manifests_15082:true_bitrate;tfw_legacy_timeline_sunset:true;tfw_tweet_edit_frontend:on&id=${input}&lang=en&token=463csqei5v&er314w=5d3k84nflgwx&sotjrh=hq2m8l1pd0al&w93msi=e0rv68u9uca&i4l8z0=9sif78bj1wos&11ga8a=1c5q80rjdxtfo&i3ssqg=hf38hgb8fyc9&o3x2ug=971aofk8p5bm&ovkh3k=2c8tmlyqfiv2`;

const regex = (input) => {
	const regex = /twitter\.com\/.*\/status(?:es)?\/([^/?]+)/.test(input)
		? input.match(/twitter\.com\/.*\/status(?:es)?\/([^/?]+)/gm)?.[0]?.match(/[0-9]{19,20}/g)?.[0]
		: false;

	if (!regex) {
		return false;
	}

	return {
		id: regex,
		url: input
	};
};

const _parseDestructuring = (data) => {
	const {
		user,
		text: caption,
		created_at: createdAt,
		favorite_count: likeCount,
		entities: { hashtags },
		conversation_count: replyCount,
		mediaDetails,
		photos,
		video
	} = data;
	const {
		name,
		screen_name: username,
		verified: isVerified,
		is_blue_verified: isBlueVerified,
		profile_image_url_https: profilePicture
	} = user;

	const container = {
		username,
		author: name,
		caption,
		published: new Date(createdAt).getTime(),
		liked: likeCount,
		replies: replyCount,
		isVerified,
		isBlueVerified,
		profilePicture,
		hashtags
	};

	if (photos?.length) {
		container.medias = photos.map((v) => ({
			url: v.url,
			type: 'image',
			ratio: {
				width: v.width,
				height: v.height
			}
		}));
		return container;
	}

	container.viewCount = video.viewCount;
	container.thumbnail = video.poster;

	let info;

	return {
		...container,
		medias: mediaDetails.map((v) => ({
			url: (info = v.video_info.variants
				.filter((w) => w?.content_type === 'video/mp4')
				?.sort((a, b) => (b?.bit_rate > a?.bit_rate ? 1 : -1)))[0].url,
			type: 'video',
			duration: v.video_info.duration_millis / 1000,
			bitrates: info[0].bitrate,
			ratio: {
				width: v.original_info.width,
				height: v.original_info.height
			}
		}))
	};
};

/**
 * @typedef {{author: string, username: string, caption: string, published: string, liked: number, replies: number, hashtags: string[] }} InfoRaw
 * @typedef {{url: string, type: 'image' | 'video', ratio: { width: number, height: number }, duration?: number}} MediaRaw
 */

/**
 * Download Twitter media.
 * @param {string} input
 * @returns {Promise<InfoRaw & {medias: MediaRaw[]} & {error?: string}>}
 * @throws {Error}
 */
export const twitterDownload = (input) =>
	new Promise(async (resolve, reject) => {
		if (!regex(input)) {
			return resolve({ error: 'This is not a valid Twitter URL.' });
		}

		const { id } = regex(input);

		try {
			const data = await fetchJSON(_apiV3(id), {
				headers: {
					'User-Agent':
						'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 YaBrowser/23.1.5.750 (beta) Yowser/2.5 Safari/537.36'
				}
			});

			if ('tombstone' in data) {
				return resolve({ error: data.tombstone.text.text });
			}

			resolve(_parseDestructuring(data));
		} catch (err) {
			reject(err);
		}
	});
