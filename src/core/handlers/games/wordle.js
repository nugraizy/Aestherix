import configuration from '../../../helper/config/connect.js';
import { getLocale, useLocale } from '../../../helper/i18n/index.js';

const handleWordle = async ({ from, isAdmin, isGroup, body, message, sender }, client, settings) => {
	const locale = await getLocale(from);
	const L = useLocale(locale, 'common');

	const playWordle = async () => {
		const wordle = configuration.games.wordle.get(sender);

		if (!wordle?.isPlaying()) {
			return;
		}

		const guess = wordle.checkInput(body);

		if (guess?.isWin) {
			const response = {
				text: `${L.core.games.youWin}\n\n${guess.board}\n${guess.words}\n\nStatistic :\n${guess.guessed
					.map((v, i) => `${i + 1}. ${v.input}\n${v.board}`)
					.join('\n')}\n\n${L.core.games.playTime} ${guess.duration}`
			};

			await client.send(from, response, { quoted: message });
		} else {
			await client.reply(from, `${guess.board}\n\n${guess.message}\n${L.core.games.playTime} ${guess.duration}`, message);
		}
	};

	if ((!isGroup || settings?.games === 'enable' || isAdmin) && !configuration.flags.onlyLogs) {
		await playWordle();
	}
};

export default handleWordle;
