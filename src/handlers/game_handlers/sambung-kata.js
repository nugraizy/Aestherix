import configuration from '../../helper/config/connect.js';

const sambungKataHandler = async ({ from, isGroup, sender, body, message, isAdmin }, client, settings) => {
	const gameData = configuration.games['word'].get(from);

	const playGame = async () => {
		if (!gameData) {
			return;
		}

		const result = await gameData.guess(body, sender, from, client);

		if (!result || ('status' in result && !result.status)) {
			if (result && result.message) {
				await client.instance.reply(result.message, { from, quoted: message });
			}

			return;
		}

		await client.instance.send(
			from,
			{
				text: `This is Word Play Game.\n\nGuess the word for the given clue:\nWord: ${result.words}\nClue: ${
					result.clue
				}\nTurn: @${result.turn.split('@')[0]}`,
				contextInfo: {
					mentionedJid: [result.turn]
				}
			},
			{ quoted: message }
		);
	};

	if (isGroup && (settings[from]?.games === 'enable' || isAdmin) && !configuration.OPTIONS.onlyLogs) {
		await playGame();
	}
};

export default sambungKataHandler;
