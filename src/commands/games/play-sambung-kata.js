import { cmdId } from '../../helper/modules/prefix.js';
import { getSambungkataSession, SambungKata } from '../../utils/games/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'sambungkata',
	minifiedDescription: 'Play Word Play',
	description: 'Word Play Game.',
	usage: '!sambungkata',
	aliases: ['sambung'],
	category: 'Games',
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run({ isGroup, message, from, sender, query }, client) {
		if (!isGroup) {
			return await client.reply(from, 'This feature only for groups', message);
		}

		const statusGame = getSambungkataSession(from);

		if (!statusGame) {
			new SambungKata(sender, undefined, from);

			await client.send(
				from,
				{
					buttonText: 'Open List',
					title: 'Sambung Kata',
					text: '\t',
					footer: 'Powered by Hidden Finder',
					sections: [{ rows: [{ title: 'Play', rowId: cmdId('sambung', 'player 2') }], title: `${__botName} | Word Game` }]
				},
				{}
			);
		} else if (query === 'player 2') {
			if (statusGame.checkStatus() === 'waiting' && (statusGame.player1 === sender || statusGame.player2 === sender)) {
				await client.reply(from, statusGame.throwResponse().message, message);
				return;
			} else if (statusGame.checkStatus() === 'playing' && (statusGame.player1 === sender || statusGame.player2 === sender)) {
				await client.reply(from, statusGame.throwResponse().message, message);
				return;
			} else if (statusGame.player1 !== sender && statusGame.player2 === undefined && statusGame.checkStatus() === 'waiting') {
				const data = await statusGame.start(sender, client);

				await client.send(
					from,
					{
						text: `This is Word Play Game.

Guess the word for given clue :
Word : ${data.value}
Clue : ${data.clue}
Turn : @${data.turn.split('@')[0]}`,
						mentions: [data.turn]
					},
					{}
				);
			}
		}
	}
};
