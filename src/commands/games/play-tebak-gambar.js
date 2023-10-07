import dayjs from 'dayjs';

import { color, INFOLOG } from '../../utils/modules/index.js';
import { startTG } from '../../utils/games/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'tebakgambar',
	description: 'Play Guess the image',
	usage: '!tebakgambar',
	aliases: ['tg', 'tebak'],
	category: 'Games',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run(message, client) {
		const time = dayjs().format('HH:mm:ss DD/MM');

		INFOLOG(
			`[${color(time, 'cyan')}]`,
			`${color('Starting Guess The Image Games.', '#01cdfe')}  to ${color(message.prettyNumber, '#ff71ce')}`
		);

		const game = await startTG(client, message.from, message, 20);

		if (game.status === 'playing') {
			return await client[botNum].reply(`Your game is already playing!\n${game.remaining}s left`, {
				groupMetadata: message.groupMetadata,
				from: message.from,
				quoted: game.data
			});
		}
	}
};
