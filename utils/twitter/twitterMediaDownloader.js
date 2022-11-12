import { fetchJSON, fetchTEXT } from '../../helper/index.js';

const regex = (input) => {
	const regex = /twitter\.com\/.*\/status(?:es)?\/([^/?]+)/.test(input) ? input.match(/twitter\.com\/.*\/status(?:es)?\/([^/?]+)/gm)?.[0]?.match(/[0-9]{19,20}/g)?.[0] : false;

	if (!regex) {
		return false;
	}

	return {
		id: regex,
		url: input,
	};
};

const _api = (input) => `https://tweetpik.com/api/tweets/${input}`;
/**
 * @typedef {{author: string, username: string, verified: true | false, caption: string, published: string, liked: number, retweet: number, replies: number}} InfoRaw
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
			const data = await fetchTEXT(_api(id), { headers: { cookie: '_fbp=fb.1.1657783842199.544637810' } });

			if (data == '') {
				return resolve({ error: 'Something went wrong with the URL.' });
			}

			const { name, username, verified, text, created_at: createdAt, like_count: likeCount, retweet_count: retweetCount, reply_count: replyCount, media: medias } = JSON.parse(data);

			container = { author: name, username, verified, caption: text, published: createdAt, liked: likeCount, retweet: retweetCount, replies: replyCount, medias: [] };

			for (const media of medias) {
				if (media.type == 'photo') {
					container.medias.push({
						url: media.url,
						type: 'image',
					});
					continue;
				}

				const data = await fetchJSON(_api(`${id}/video`), { headers: { cookie: '_fbp=fb.1.1657783842199.544637810' } });

				container.medias.push({
					url: data.variants.slice(-1)[0].url,
					type: 'video',
				});
			}

			resolve(container);
		} catch (err) {
			reject(err);
		}
	});
