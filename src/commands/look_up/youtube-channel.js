import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { youtubeChannel } from '../../utils/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
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
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const Ll = useLocale(locale, 'look_up');

		if (!query) {
			return await client.reply(from, L.errors.noQuery, message);
		}

		const channel = await youtubeChannel(query);

		if (channel?.error) {
			return await client.reply(from, `${L.errors.failedSearch}\n\n${channel.error}`, message);
		}

		const { author, avatar } = channel;

		client.send(from, {
			image: {
				url: avatar.url
			},
			caption: `${Ll.titles.youtubeChannel.formatHeaders()}

${Ll.labels.channelName} : ${author.name}
${Ll.labels.username} : ${author.username}
${Ll.labels.subscribers} : ${author.subsCount}
${Ll.labels.totalVideos} : ${author.vidsCount}
${Ll.labels.verified} : ${author.isVerified ? L.core.labels.yes : L.core.labels.no}
${Ll.labels.artistVerified} : ${author.isVerifiedArtist ? L.core.labels.yes : L.core.labels.no}
${Ll.labels.channelUrl} : ${author.channelUrlId}
${Ll.labels.channelUrlUsername} : ${author.channelUrlUsername}`.formatForm()
		});
	}
});
