import configuration from '../../helper/config/connect.js';
import { Wordle } from '../../utils/games/index.js';
import { loggers, color } from '../../utils/modules/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'wordle',
	minifiedDescription: 'Play Wordle',
	description: 'Play Wordle.',
	usage: '!wordle <play/exit/info>',
	category: 'Games',
	aliases: ['wordl'],
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run({ from, message, query, args, sender, prettyNumber }, client) {
		if (!query) {
			return await client.instance.reply('Please specify arguments.\n\nUsage: !wordle <play/exit/info>', {
				from,
				quoted: message
			});
		}

		if (args[1] === 'play') {
			const wordle = new Wordle(sender);

			if (configuration.games.wordle.has(sender) && wordle.message) {
				return await client.instance.reply('You are already playing Wordle.', { from, quoted: message });
			}

			loggers.warning(
				`${color('Wordle Game Answer : ', '#FF99C8')} ${color(wordle.word, 'white')} to ${color(prettyNumber, '#E4C1F9')}`
			);

			const data = await client.instance.reply(`${wordle.board.join('')}\nTot. words : ${wordle.word.length}`, {
				from,
				quoted: message
			});

			wordle.messages = data;
		} else if (args[1] === 'exit') {
			if (!configuration.games.wordle.has(sender)) {
				return await client.instance.reply('You are not playing Wordle.', { from, quoted: message });
			}

			const wordle = new Wordle(sender);

			wordle.exit();

			await client.instance.reply('You have exited Wordle.', { from, quoted: message });
		} else if (args[1] === 'info') {
			await client.instance.reply(
				'This is a Wordle Game. You have given a word with only 5 letter. And you have to guess the word, Every guessed word will checked and measured by how closed the input to the word is.\n\nGreen [🟩] : Correct Alphabet\nYellow [🟨] : Close\nBlack [⬛] : Not Close/Invalid\nWhite [⬜] : First Board Play.\n\nUsage: !wordle <play/exit/info>',
				{ from, quoted: message }
			);
		}
	}
};
