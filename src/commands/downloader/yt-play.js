import parser from 'yargs-parser';

import configuration from '../../helper/config/connect.js';

export default {
	name: 'ytplay',
	description: 'Instantly Download a YouTube video/audio.',
	usage: '!ytplay <query> [options]\nOptions:\n-mp3, Download as Audio\n-mp4, Download as Video',
	aliases: ['ytp', 'yt', 'play'],
	category: 'Downloader',
	cooldown: 5,
	limit: 4,
	status: 'enable',
	async run(message, client) {
		if (!message.query) {
			return await client[botNum].reply(
				{ groupMetadata: message.groupMetadata, quoted: message.message, from: message.from },
				'Please enter a query'
			);
		}

		let { audio, video } = parser(message.query.toLowerCase(), {
			configuration: { 'short-option-groups': false },
			alias: { audio: ['aud', 'mp3', 'musik', 'music'], video: ['vid', 'mp4', 'video', 'videos'] }
		});

		if (audio) {
			await configuration.cmds.commands.get('ytaudio').run(message, client);
		}

		if (video) {
			await configuration.cmds.commands.get('ytvideo').run(message, client);
		}

		if (!audio && !video) {
			await configuration.cmds.commands.get('ytaudio').run(message, client);
		}
	}
};
