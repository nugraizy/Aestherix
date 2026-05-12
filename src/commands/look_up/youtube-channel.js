import { youtubeChannel } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'youtubestalk',
	minifiedDescription: 'Look-up YouTube Channel',
	description: 'Look-up YouTube Channel.',
	usage: '!youtubestalk `<channel_id|@channel_username|channel_url>`',
	aliases: ['ytstalk', 'ytinfo', 'ytchannel'],
	category: 'Look-up',
	cooldown: 6,
	limit: 6,
	status: 'enable',
	run: async ({ from, query, message }, client) => {
		if (!query) {
			return await client.reply(from, 'Please specify a query', message);
		}

		const channel = await youtubeChannel(query);

		if (channel?.error) {
			return await client.reply(from, `Error while searching YouTube Channel\n\n${channel.error}`, message);
		}

		const { author, avatar } = channel;

		client.send(from, {
			image: {
				url: avatar.url
			},
			caption: `${'YouTube Channel Lookup'.formatHeaders()}

Channel Name : ${author.name}
Username : ${author.username}
Subscribers : ${author.subsCount}
Videos : ${author.vidsCount}
Verified : ${author.isVerified ? 'Yes' : 'No'}
Artist Verified : ${author.isVerifiedArtist ? 'Yes' : 'No'}
Channel URL : ${author.channelUrlId}
Channel URL Username : ${author.channelUrlUsername}`.formatForm()
		});
	}
};
