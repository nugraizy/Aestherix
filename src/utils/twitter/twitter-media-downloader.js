import axios from 'axios';

import { fetchJSON } from '../modules/index.js';

const _api = (input) =>
	`https://api.twitter.com/2/tweets/${input}?expansions=attachments.media_keys,author_id,entities.mentions.username&media.fields=duration_ms,height,preview_image_url,public_metrics,type,url,width,alt_text&tweet.fields=public_metrics,attachments,source,created_at&user.fields=username`;
const _apiVideos = (input) => `https://api.twitterpicker.com/tweet/mediav2?id=${input}`;

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

/**
 * @typedef {{author: string, username: string, caption: string, published: string, liked: number, retweet: number, replies: number, quoted: number, impression: number}} InfoRaw
 * @typedef {{url: string, type: 'image' | 'video'}} MediaRaw
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
			let container = {};
			const data = await fetchJSON(_api(id), {
				headers: {
					Authorization: `Bearer ${process.env.TWITTER_ACCESS_TOKEN}`
				}
			});

			if ('errors' in data) {
				return resolve({ error: 'Something went wrong with the URL.' });
			}

			const {
				text,
				created_at: createdAt,
				public_metrics: {
					like_count: likeCount,
					retweet_count: retweetCount,
					reply_count: replyCount,
					quote_count: quoteCount,
					impression_count: impressionCount
				}
			} = data.data;
			const {
				media: medias,
				users: [{ name, username }]
			} = data.includes;

			container = {
				username,
				author: name,
				caption: text,
				published: createdAt,
				liked: likeCount,
				retweet: retweetCount,
				replies: replyCount,
				quoted: quoteCount,
				impression: impressionCount,
				medias: []
			};

			for (const { type, url, width, height } of medias) {
				if (type === 'photo') {
					container.medias.push({
						url: url,
						type: 'image'
					});
					continue;
				}

				const {
					data: {
						media: { videos }
					}
				} = await axios.get(_apiVideos(id));

				container.medias.push({
					url: videos.find((v) => v.url.includes(`${width}x${height}`)).url,
					type: 'video'
				});
			}

			resolve(container);
		} catch (err) {
			reject(err);
		}
	});
