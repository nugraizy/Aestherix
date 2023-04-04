import configuration from '../../helper/config/connect.js';

const handler = async ({ from, isGroup, sender, body, message, isAdmin, groupMetadata }, client, settings) => {
	const data = configuration.games['word'].get(from);
	const play = async () => {
		if (!data) {
			return;
		}

		const sambung = await data.guess(body, sender, from, client);

		if (!sambung) {
			return;
		}

		if ('status' in sambung && !sambung.status) {
			return await client[botNum].reply({ groupMetadata, from, quoted: message }, sambung.message);
		}

		await client[botNum].send(
			from,
			{
				text: `This is Word Play Game.

Guess the word for given clue :
Word : ${sambung.words}
Clue : ${sambung.clue}
Turn : @${sambung.turn.split('@')[0]}`,
				contextInfo: {
					mentionedJid: [sambung.turn]
				}
			},
			{ groupMetadata, quoted: message }
		);
	};

	if (isGroup && (settings[from]?.games === 'enable' || isAdmin) && !configuration.OPTIONS.onlyLogs) {
		await play();
	}
};

const sambungKataHandler = handler;

export default sambungKataHandler;
