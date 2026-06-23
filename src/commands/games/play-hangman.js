import configuration from '../../helper/config/connect.js';
import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { Hangman } from '../../utils/games/index.js';
import { loggers, color } from '../../utils/modules/index.js';
import { getPrefix } from '../../helper/modules/prefix.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'hangman',
	minifiedDescription: 'Play Hangman',
	description: 'Play Hangman game.',
	usage: '!hangman `<play/exit/info>`',
	category: 'Games',
	aliases: ['hm'],
	cooldown: 1,
	limit: 0,
	status: 'enable',
	async run({ from, message, query, args, sender, prettyNumber }, client) {
		const locale = await getLocale(from);
		const prefix = getPrefix();
		const L = useLocale(locale, 'common', { prefix });
		const H = useLocale(locale, 'hangman', { prefix });

		if (!query) {
			return await client.reply(from, L.errors.invalidArgs, message);
		}

		if (args[1] === 'play') {
			const hangman = new Hangman(sender);

			if (configuration.games.hangman.has(sender) && hangman.message) {
				return await client.reply(from, L.errors.alreadyPlaying, message);
			}

			loggers.warning(
				`${color('Hangman Game Answer : ', 'pink')} ${color(hangman.word, 'white')} to ${color(prettyNumber, 'lilac')}`
			);

			const displayWord = hangman.getDisplayWord();
			const hangmanStage = hangman.getHangmanStage();

			const data = await client.reply(
				from,
				`${H.game.title}\n\n${hangmanStage}\n\n${H.game.wordLabel} ${displayWord}\n${H.game.wrongGuessesLabel} 0/6\n${H.game.guessedLettersLabel} ${H.game.none}\n\n${H.game.guessLetter}\n\n${H.game.usage}`,
				message
			);

			hangman.messages = data;
		} else if (args[1] === 'guess') {
			if (!configuration.games.hangman.has(sender)) {
				return await client.reply(from, L.errors.notPlaying, message);
			}

			const hangman = new Hangman(sender);
			const letter = args[2];

			if (!letter) {
				return await client.reply(from, H.errors.provideLetter, message);
			}

			const result = hangman.guessLetter(letter);

			if (result.status === 'invalid') {
				return await client.reply(from, H.errors.invalidLetter, message);
			}

			if (result.status === 'already_guessed') {
				return await client.reply(from, t(locale, 'hangman.errors.alreadyGuessed', { prefix, letter: letter.toUpperCase() }), message);
			}

			if (result.status === 'win') {
				return await client.reply(
					from,
					`${H.game.win}\n\n${H.game.wordLabel} ${result.word}\n${H.game.wrongGuessesLabel} ${result.wrongGuesses}/6\n${H.game.durationLabel} ${result.duration}`,
					message
				);
			}

			if (result.status === 'lose') {
				return await client.reply(
					from,
					`${H.game.lose}\n\n${result.hangman}\n\n${H.game.theWordWas} ${result.word}\n${H.game.durationLabel} ${result.duration}`,
					message
				);
			}

			const statusEmoji = result.status === 'correct' ? H.game.correct : H.game.wrong;

			await client.reply(
				from,
				`${statusEmoji} ${H.game.title}\n\n${result.hangman}\n\n${H.game.wordLabel} ${result.displayWord}\n${H.game.wrongGuessesLabel} ${result.wrongGuesses}/6\n${H.game.guessedLettersLabel} ${result.guessed}\n${H.game.remainingLabel} ${result.remaining}`,
				message
			);
		} else if (args[1] === 'word') {
			if (!configuration.games.hangman.has(sender)) {
				return await client.reply(from, L.errors.notPlaying, message);
			}

			const hangman = new Hangman(sender);
			const word = args.slice(2).join(' ');

			if (!word) {
				return await client.reply(from, H.errors.provideWord, message);
			}

			const result = hangman.guessWord(word);

			if (result.status === 'win') {
				return await client.reply(
					from,
					`${H.game.win}\n\n${H.game.wordLabel} ${result.word}\n${H.game.wrongGuessesLabel} ${result.wrongGuesses}/6\n${H.game.durationLabel} ${result.duration}`,
					message
				);
			}

			if (result.status === 'lose') {
				return await client.reply(
					from,
					`${H.game.lose}\n\n${result.hangman}\n\n${H.game.theWordWas} ${result.word}\n${H.game.durationLabel} ${result.duration}`,
					message
				);
			}

			await client.reply(
				from,
				`${H.game.wrongWord}\n\n${result.hangman}\n\n${H.game.wordLabel} ${result.displayWord}\n${H.game.wrongGuessesLabel} ${result.wrongGuesses}/6\n${H.game.guessedLettersLabel} ${result.guessed}\n${H.game.remainingLabel} ${result.remaining}`,
				message
			);
		} else if (args[1] === 'exit') {
			if (!configuration.games.hangman.has(sender)) {
				return await client.reply(from, L.errors.notPlaying, message);
			}

			const hangman = new Hangman(sender);

			hangman.exit();

			await client.reply(from, L.success.exited, message);
		} else if (args[1] === 'info') {
			await client.reply(
				from,
				`${H.info.title}\n\n${H.info.description}\n\n${H.info.howToPlay}\n${H.info.startGame}\n${H.info.guessLetterCmd}\n${H.info.guessWordCmd}\n${H.info.exitGame}\n\n${H.info.rules}\n${H.info.rule1}\n${H.info.rule2}\n${H.info.rule3}\n${H.info.rule4}\n\n${H.info.example}\n${H.info.example1}\n${H.info.example2}\n${H.info.example3}`,
				message
			);
		}
	}
});
