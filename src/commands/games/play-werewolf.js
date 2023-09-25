import { delay } from '../../utils/modules/index.js';
import { Werewolf } from '../../utils/games/index.js';

const row = [
	{ rows: [{ title: 'JOIN', rowId: '.ww join' }], title: 'VOID BOT | Werewolf Games' },
	{ rows: [{ title: 'NEW GAME', rowId: '.ww newGame' }], title: 'VOID BOT | Werewolf Games' },
	{ rows: [{ title: 'EXIT GAME', rowId: '.ww exit' }], title: 'VOID BOT | Werewolf Games' },
	{ rows: [{ title: 'DELETE GAME', rowId: '.ww delete' }], title: 'VOID BOT | Werewolf Games' }
];

/**
 * @type {import('../types.js').Plugins}
 */
export default {
	name: 'werewolf',
	description: 'Play Werewolf',
	usage: '!ww <arguments>',
	category: 'Games',
	aliases: ['ww'],
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run({ from, message, args, sender, pushname, isGroup, groupMetadata }, client) {
		if (args[1] === 'kill') {
			const werewolf = new Werewolf(sender, args[3], client);
			const kill = werewolf.killPlayerAsWerewolf(sender, args[2], args[3]);

			if (kill.error && !('data' in kill)) {
				return await client[botNum].reply({ groupMetadata, from, quoted: message }, kill.message);
			}

			for (const data of kill.data) {
				await client[botNum].send(data.id, { text: data.message });
			}
		} else if (args[1] === 'seer') {
			const werewolf = new Werewolf(sender, args[3], client);
			const seer = werewolf.seerSomeone(sender, args[2], args[3]);

			if (seer.error && !('data' in seer)) {
				return await client[botNum].reply({ groupMetadata, from, quoted: message }, seer.message);
			}

			for (const data of seer.data) {
				await client[botNum].send(data.id, { text: data.message });
			}
		} else if (args[1] === 'guard') {
			const werewolf = new Werewolf(sender, args[3], client);
			const guard = werewolf.guardSomeone(sender, args[2], args[3]);

			if (guard.error && !('data' in guard)) {
				return await client[botNum].reply({ groupMetadata, from, quoted: message }, guard.message);
			}

			for (const data of guard.data) {
				await client[botNum].send(data.id, { text: data.message });
			}
		} else if (args[1] === 'vote') {
			const werewolf = new Werewolf(sender, args[3], client);
			const vote = werewolf.voteSomeone(sender, args[2], args[3]);

			if (vote.error && !('data' in vote)) {
				return await client[botNum].reply({ groupMetadata, from, quoted: message }, vote.message);
			}

			for (const data of vote.data) {
				await client[botNum].send(data.id, { text: data.message });
			}

			client[botNum].ev.emit('werewolf.cycle', {
				time: 'voted',
				id: args[3],
				text: `@${sender.split('@')[0]} voted for @${args[2].split('@')[0]}`,
				mentions: [args[2], sender],
				...client
			});
		} else if (args[1] === 'delete') {
			const werewolf = new Werewolf(sender, from, client);
			const deletes = werewolf.deleteGame(sender);

			return await client[botNum].reply({ groupMetadata, from, quoted: message }, deletes.message);
		} else if (args[1] === 'join') {
			sender = args[2] || sender;
			pushname = args[3] || pushname;

			const werewolf = new Werewolf(sender, from, client);
			const join = werewolf.werewolfJoin(sender, from, pushname);

			return join.error
				? client[botNum].reply({ groupMetadata, from, quoted: message }, join.message)
				: client[botNum].send(
						from,
						{
							text: `${join.message}\n${join.mentions.map((v) => `@${v.split('@')[0]}`).join('\n')}`,
							mentions: join.mentions
						},
						{ groupMetadata, quoted: message }
				  ); /* eslint-disable-line */
		} else if (args[1] === 'newGame') {
			const werewolf = new Werewolf(sender, from, client);

			if (werewolf.getDataGame(from)) {
				await client[botNum].send(
					from,
					{
						text: '\t',
						title: 'Sesi sudah ada di group ini. Pilih join untuk bergabung ke permainan',
						footer: 'Made by Void Bot. Powered by Hidden Finder',
						buttonText: 'Open list',
						sections: row
					},
					{ groupMetadata }
				);

				return;
			}

			new Werewolf(sender, from, client, pushname, true);

			const caption = 'Permainan Werewolf berhasil dibuat.';

			await client[botNum].send(
				from,
				{
					text: '\t',
					buttonText: 'Open list',
					footer: 'Made by Void Bot. Powered by Hidden Finder',
					title: `${caption}\nPilih salah satu.`,
					sections: row
				},
				{ groupMetadata }
			);
		} else if (args[1] === 'exit') {
			const werewolf = new Werewolf(sender, from, client);
			const exit = werewolf.exitGame(sender, from);

			return await client[botNum].reply({ from, quoted: message }, exit.message);
		} else if (args[1] === 'start') {
			const werewolf = new Werewolf(sender, from, client);
			const start = werewolf.startGame(sender, from);

			if (start.error) {
				return await client[botNum].reply({ groupMetadata, from, quoted: message }, start.message);
			}

			await client[botNum].send(from, { text: start.message }, { groupMetadata });
			await client[botNum].send(
				from,
				{
					text: `~ Player Werewolf ~\n\n${start.data.playersData
						.map((v, i) => `${i + 1}. @${v.id.split('@')[0]} | ${v.name}`)
						.join('\n')}`,
					mentions: start.data.playersData.map((v) => v.id)
				},
				{ groupMetadata }
			);

			await delay(3000);

			await client[botNum].send(
				from,
				{ text: start.data.gameDialogue.replace('{0}', start.data.gameTime) },
				{ groupMetadata }
			);

			for (const player of start.data.playersData) {
				if (player.role === 'villager') {
					client[botNum].send(player.id, { text: player.dialogue });
				} else if (player.role === 'werewolf') {
					client[botNum].send(player.id, {
						buttonText: 'Open list',
						footer: 'Made by Void Bot. Powered by Hidden Finder',
						title:
							'Kamu adalah Serigala. Dan saat ini merupakan waktu yang tepat untuk membunuh seseorang.\nPilih salah satu player.',
						text: '\t',
						sections: Array(start.data.playersData.length)
							.fill(undefined)
							.map((v, i) => {
								return {
									rows: [
										{
											title: `KILL ${start.data.playersData[i].name}`,
											rowId: `.ww kill ${start.data.playersData[i].id} ${from}`
										}
									],
									title: 'VOID BOT | Werewolf Games'
								};
							})
					});
				} else if (player.role === 'seer') {
					client[botNum].send(player.id, {
						buttonText: 'Open list',
						footer: 'Made by Void Bot. Powered by Hidden Finder',
						title:
							'Kamu adalah Penerawang. Dan saat ini merupakan waktu yang tepat untuk menerawang seseorang.\nPilih salah satu player.',
						text: '\t',
						sections: Array(start.data.playersData.length)
							.fill(undefined)
							.map((v, i) => {
								return {
									rows: [
										{
											title: `TERAWANG ${start.data.playersData[i].name}`,
											rowId: `.ww seer ${start.data.playersData[i].id} ${from}`
										}
									],
									title: 'VOID BOT | Werewolf Games'
								};
							})
					});
				} else if (player.role === 'guard') {
					client[botNum].send(player.id, {
						buttonText: 'Open list',
						footer: 'Made by Void Bot. Powered by Hidden Finder',
						title:
							'Kamu adalah Penjaga. Dan saat ini merupakan waktu yang tepat untuk memjaga seseorang.\nPilih salah satu player.',
						text: '\t',
						sections: Array(start.data.playersData.length)
							.fill(undefined)
							.map((v, i) => {
								return {
									rows: [
										{
											title: `JAGA ${start.data.playersData[i].name}`,
											rowId: `.ww guard ${start.data.playersData[i].id} ${from}`
										}
									],
									title: 'VOID BOT | Werewolf Games'
								};
							})
					});
				}
			}

			start.data.startGameCycle(from, start.data.gameTimeCycle);
		} else {
			if (!isGroup) {
				return await client[botNum].reply({ groupMetadata, from, quoted: message }, 'This commands for group only');
			}

			const werewolfs = new Werewolf(sender, from, client);

			if (werewolfs.getDataGame(from) && !werewolfs.gameStarted) {
				await client[botNum].send(
					from,
					{
						text: '\t',
						title: 'Sesi sudah ada di group ini. Pilih join untuk bergabung ke permainan',
						footer: 'Made by Void Bot. Powered by Hidden Finder',
						buttonText: 'Open list',
						sections: row
					},
					{ groupMetadata }
				);

				return;
			} else if (werewolfs.getDataGame(from) && werewolfs.gameStarted) {
				return await client[botNum].reply(
					{ groupMetadata, from, quoted: message },
					'Sesi sudah ada di group ini dan permainan sudah dimulai.'
				);
			}

			new Werewolf(sender, from, client, pushname, true);

			const caption = 'Permainan Werewolf berhasil dibuat.';

			await client[botNum].send(
				from,
				{
					text: '\t',
					buttonText: 'Open list',
					footer: 'Made by Void Bot. Powered by Hidden Finder',
					title: `${caption}\nPilih salah satu.`,
					sections: row
				},
				{ groupMetadata }
			);
		}
	}
};
