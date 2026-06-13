import configuration from '../../helper/config/connect.js';
import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { Wordle } from '../../utils/games/index.js';
import { loggers, color } from '../../utils/modules/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'wordle',
	minifiedDescription: 'Play Wordle',
	description: 'Play Wordle.',
	usage: '!wordle `<play/exit/info>`',
	category: 'Games',
	aliases: ['wordl'],
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run({ from, message, query, args, sender, prettyNumber }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return await client.reply(from, L.errors.invalidArgs, message);
		}

		if (args[1] === 'play') {
			const wordle = new Wordle(sender);

			if (configuration.games.wordle.has(sender) && wordle.message) {
				return await client.reply(from, L.errors.alreadyPlaying, message);
			}

			loggers.warning(
				`${color('Wordle Game Answer : ', 'pink')} ${color(wordle.word, 'white')} to ${color(prettyNumber, 'lilac')}`
			);

			const data = await client.reply(from, `${wordle.board.join('')}\n\nTot. words : ${wordle.word.length}`, message);

			wordle.messages = data;
		} else if (args[1] === 'exit') {
			if (!configuration.games.wordle.has(sender)) {
				return await client.reply(from, L.errors.notPlaying, message);
			}

			const wordle = new Wordle(sender);

			wordle.exit();

			await client.reply(from, L.success.exited, message);
		} else if (args[1] === 'info') {
			await client.reply(
				from,
				`Wordle Game

Guess the hidden 5-letter word.
Each time you make a guess, the game will evaluate how close your guess is to the correct word.

- 🟩 Green: Correct letter in the correct position
- 🟨 Yellow: Correct letter in the wrong position
- ⬛ Black: Letter is not in the word
- ⬜ White: Initial state before any guesses

Can you find the word in as few attempts as possible?\n\nUsage: !wordle <play/exit/info>`,
				message
			);
		}
	}
});
