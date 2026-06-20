import { BOT_NAME } from '../../core/constants.js';

import { cmdId } from '../../helper/modules/prefix.js';
import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { getSambungkataSession, SambungKata } from '../../utils/games/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'sambungkata',
	minifiedDescription: 'Play Word Play',
	description: 'Word Play Game.',
	usage: '!sambungkata',
	aliases: ['sambung'],
	category: 'Games',
	cooldown: 1,
	limit: 0,
	status: 'enable',
	async run({ isGroup, message, from, sender, query }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!isGroup) {
			return await client.reply(from, L.errors.groupOnly, message);
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
					sections: [{ rows: [{ title: 'Play', rowId: cmdId('sambung', 'player 2') }], title: `${BOT_NAME} | Word Game` }]
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
						text: `${L.core.games.wordPlayPrompt}${data.value}\n\nClue : ${data.clue}\nTurn : @${data.turn.split('@')[0]}`,
						mentions: [data.turn]
					},
					{}
				);
			}
		}
	}
});
