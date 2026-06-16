import { getLocale } from '../../helper/i18n/index.js';
import { color, loggers } from '../../utils/modules/index.js';
import { startTG } from '../../utils/games/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'tebakgambar',
	minifiedDescription: 'Play Guess',
	description: 'Play Guess the image.',
	usage: '!tebakgambar',
	aliases: ['tg', 'tebak'],
	category: 'Games',
	cooldown: 1,
	limit: 0,
	status: 'enable',
	async run(message, client) {
		const locale = await getLocale(message.from);

		loggers.warning(`${color('Starting Guess The Image Games.', 'pink')}  to ${color(message.prettyNumber, 'lilac')}`);

		const game = await startTG(client, message.from, message, 20);

		if (game.status === 'playing') {
			return await client.reply(message.from, `Your game is already playing!\n${game.remaining}s left`, game.data);
		}
	}
});
