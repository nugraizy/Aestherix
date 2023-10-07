import { youtubeChannel } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'youtubestalk',
	description: 'Lookup YouTube Channel',
	usage: '!youtubestalk <channel_id|@channel_username|channel_url>',
	aliases: ['ytstalk', 'ytinfo', 'ytchannel'],
	category: 'Look-up',
	cooldown: 6,
	limit: 6,
	status: 'enable',
	run: async ({ from, query, message, groupMetadata }, client) => {
		if (!query) {
			return await client[botNum].reply('Please specify a query', { from, quoted: message, groupMetadata });
		}

		const channel = await youtubeChannel(query);

		if ('error' in channel) {
			return await client[botNum].reply(`Error while searching YouTube Channel\n\n${channel.error}`, {
				from,
				quoted: message,
				groupMetadata
			});
		}

		const { author, avatar } = channel;

		client[botNum].send(from, {
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
Channel URL Username : ${author.channelUrlUsername}`
		});
	}
};
