import { fetchJSON } from '../modules/index.js';

// const _apiV2 = (input) =>
// 	`https://api.twitter.com/2/tweets/${input}?expansions=attachments.media_keys,author_id,entities.mentions.username&media.fields=duration_ms,height,preview_image_url,public_metrics,type,url,width,alt_text,variants&tweet.fields=public_metrics,attachments,source,created_at&user.fields=username`;

const _apiV1 = (input) => `https://api.twitterpicker.com/tweet/datav3?id=${input}`;

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
		published: createdAt,
		liked: likeCount,
		replies: replyCount,
		isVerified,
		isBlueVerified,
		profilePicture,
		hashtags
	};

	if (photos?.length > 0) {
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

	container.viewCount = video.view_count;
	container.thumbnail = video.poster;

	return {
		...container,
		medias: mediaDetails.map((v) => ({
			url: v.video_info.variants.filter((w) => w?.content_type === 'video/mp4')?.sort((a, b) => b?.bit_rate - a?.bit_rate)[0],
			type: 'video',
			duration: v.duration_millis,
			bitrates: v.bitrate,
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
			const data = await fetchJSON(_apiV1(id), {
				headers: {
					'User-Agent':
						'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 YaBrowser/23.1.5.750 (beta) Yowser/2.5 Safari/537.36'
				}
			});

			resolve(_parseDestructuring(data));
		} catch (err) {
			reject(err);
		}
	});
