import configuration from '../../helper/config/connect.js';

const handleWordle = async ({ from, isAdmin, isGroup, body, message, sender, groupMetadata }, client, settings) => {
	const playWordle = async () => {
		const wordle = configuration.games.wordle.get(sender);

		if (!wordle?.isPlaying()) {
			return;
		}

		const guess = wordle.checkInput(body);

		if (guess?.isWin) {
			const response = {
				text: `You win!\n\n${guess.board}\n${guess.words}\n\nStatistic:\n${guess.guessed
					.map((v, i) => `${i + 1}. ${v.input}\n${v.board}`)
					.join('\n')}\n\nLama permainan: ${wordle.timeLength}`
			};

			await client.instance.send(from, response, { groupMetadata, quoted: message });
		} else {
			await client.instance.reply(guess.board, { from, quoted: message, groupMetadata });
		}
	};

	if ((!isGroup || settings[from]?.games === 'enable' || isAdmin) && !configuration.OPTIONS.onlyLogs) {
		await playWordle();
	}
};

export default handleWordle;
