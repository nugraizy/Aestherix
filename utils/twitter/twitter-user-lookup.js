/* global log */
import { fetchJSON } from '../../helper/index.js';

const _api = (input) =>
	`https://api.twitter.com/2/users/by?usernames=${input}&user.fields=created_at,description,profile_image_url,verified,url`;

export const twitterUser = (input) =>
	new Promise(async (resolve, reject) => {
		try {
			const data = await fetchJSON(_api(input), {
				headers: {
					Authorization: `Bearer ${process.env.TWITTER_ACCESS_TOKEN}`,
				},
			});

			if ('errors' in data) {
				return resolve({ error: 'User not found.' });
			}

			const {
				description: biograph,
				username,
				name,
				created_at: joined,
				verified,
				profile_image_url: imageProfile,
				url: personalUrl,
			} = data.data[0];

			resolve({ biograph, username, name, joined, verified, imageProfile, personalUrl });
		} catch (err) {
			log(err);
			reject(err);
		}
	});
