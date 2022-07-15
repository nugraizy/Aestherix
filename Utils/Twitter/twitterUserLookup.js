import fetch from "node-fetch";

export const twitterUser = (input) =>
	new Promise(async (resolve) => {
		try {
			const data = await (
				await fetch(URL_API(input), {
					headers: {
						Authorization: `Bearer ${process.env.BEARER_TOKEN}`,
					},
				})
			).json();
			if ("errors" in data) {
				log(data);
				return resolve({ error: "User not found." });
			}
			const { description: biograph, username, name, created_at: joined, verified, profile_image_url: imageProfile, url: personalUrl } = data.data[0];
			resolve({ biograph, username, name, joined, verified, imageProfile, personalUrl });
		} catch (err) {
			log(err);
			resolve({ error: err.messaage });
		}
	});

const URL_API = (input) => `https://api.twitter.com/2/users/by?usernames=${input}&user.fields=created_at,description,profile_image_url,verified,url`;
