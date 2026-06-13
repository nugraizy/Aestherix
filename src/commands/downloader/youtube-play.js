import parser from 'yargs-parser';

import configuration from '../../helper/config/connect.js';
import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'ytplay',
	minifiedDescription: 'Download YouTube Video/Audio',
	description: 'Instantly Download a YouTube video/audio.',
	usage: '!ytplay `<query>` `[options]`\nOptions:\n-mp3, Download as Audio\n-mp4, Download as Video',
	aliases: ['ytp', 'yt', 'play'],
	category: 'Downloader',
	cooldown: 5,
	limit: 4,
	status: 'enable',
	async run(message, client) {
		const locale = await getLocale(message.from);
		const L = useLocale(locale, 'common');

		if (!message.query) {
			return await client.reply(message.from, L.errors.noQuery, message.message);
		}

		let { audio, video } = parser(message.query.toLowerCase(), {
			configuration: { 'short-option-groups': false },
			alias: { audio: ['aud', 'mp3', 'musik', 'music'], video: ['vid', 'mp4', 'video', 'videos'] }
		});

		if (audio) {
			await configuration.registry.commands.get('ytaudio').run(message, client);
		}

		if (video) {
			await configuration.registry.commands.get('ytvideo').run(message, client);
		}

		if (!audio && !video) {
			await configuration.registry.commands.get('ytaudio').run(message, client);
		}
	}
});
