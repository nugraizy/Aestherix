import { Innertube } from 'youtubei.js';

let youtube = null;
const reg = /^(?:http?s?:\/\/)?(?:(?:www|gaming)\.)?youtube\.com\/(?:channel\/|(?:user\/)?)([@a-z\-_0-9.]+)\/?(?:[?#]?.*)/i;

const isChannelURL = (url) => ({
	validate: url.match(reg) ? true : false,
	id: url.match(reg)?.[1]
});

export const youtubeChannel = async (query) =>
	new Promise(async (resolve) => {
		try {
			if (!youtube) {
				youtube = await Innertube.create();
			}

			let author;

			const check = isChannelURL(query);

			if (check.validate) {
				if (query.includes('@')) {
					query = check.id;

					author = await youtube.search(query);

					author = author.channels.find((v, i) => {
						if (v.endpoint.metadata.url.replace('/', '') === query) {
							return author.channels[i];
						}
					});

					author = await youtube.getChannel(author.id);
				} else {
					query = author = await youtube.getChannel(query);
				}
			} else {
				if (query.includes('@')) {
					author = await youtube.search(query);

					author = author.channels.find((v, i) => {
						if (v.endpoint.metadata.url.replace('/', '') === query) {
							return author.channels[i];
						}
					});

					author = await youtube.getChannel(author.id);
				} else {
					query = author = await youtube.getChannel(query);
				}
			}

			const {
				header: {
					author: authorStats,
					banner: [{ url: bannerUrl, width: bannerWidth, height: bannerHeight }],
					subscribers: { text: subsCount },
					videos_count: { text: vidsCount },
					channel_handle: { text: username }
				},
				metadata: { url: channelUrlId, vanity_channel_url: channelUrlUsername, avatar }
			} = author;

			resolve({
				author: {
					name: authorStats.name,
					isVerified: authorStats.is_verified,
					isVerifiedArtist: authorStats.is_verified_artist,
					subsCount: Number((subsCount.match(/\d+/g) || []).join('')),
					vidsCount: Number((vidsCount.match(/\d+/g) || []).join('')),
					username,
					channelUrlId,
					channelUrlUsername
				},
				avatar: {
					url: avatar[0].url,
					width: avatar[0].width,
					height: avatar[0].height
				},
				banner: {
					url: bannerUrl,
					width: bannerWidth,
					height: bannerHeight
				}
			});
		} catch {
			resolve({
				error: 'Channel not found.'
			});
		}
	});
