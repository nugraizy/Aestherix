import { cmdId } from '../../helper/modules/prefix.js';
import { Werewolf } from '../../utils/games/index.js';
import { delay } from '../../utils/modules/index.js';

const row = [
	{ rows: [{ title: 'JOIN', rowId: cmdId('ww', 'join', null) }], title: 'message BOT | Werewolf Games' },
	{ rows: [{ title: 'NEW GAME', rowId: cmdId('ww', 'newGame', null) }], title: 'message BOT | Werewolf Games' },
	{ rows: [{ title: 'EXIT GAME', rowId: cmdId('ww', 'exit', null) }], title: 'message BOT | Werewolf Games' },
	{ rows: [{ title: 'DELETE GAME', rowId: cmdId('ww', 'delete', null) }], title: 'message BOT | Werewolf Games' }
];

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'werewolf',
	minifiedDescription: 'Play Werewolf',
	description: 'Play Werewolf.',
	usage: '!ww `<arguments>`',
	category: 'Games',
	aliases: ['ww'],
	cooldown: 2,
	limit: 2,
	status: 'enable',
	async run({ from, message, args, sender, pushname, isGroup }, client) {
		if (args[1] === 'kill') {
			const werewolf = new Werewolf(sender, args[3], client);
			const kill = werewolf.killPlayerAsWerewolf(sender, args[2], args[3]);

			if (kill.error && !('data' in kill)) {
				return await client.instance.reply(from, kill.message, message);
			}

			for (const data of kill.data) {
				await client.instance.send(data.id, { text: data.message });
			}
		} else if (args[1] === 'seer') {
			const werewolf = new Werewolf(sender, args[3], client);
			const seer = werewolf.seerSomeone(sender, args[2], args[3]);

			if (seer.error && !('data' in seer)) {
				return await client.instance.reply(from, seer.message, message);
			}

			for (const data of seer.data) {
				await client.instance.send(data.id, { text: data.message });
			}
		} else if (args[1] === 'guard') {
			const werewolf = new Werewolf(sender, args[3], client);
			const guard = werewolf.guardSomeone(sender, args[2], args[3]);

			if (guard.error && !('data' in guard)) {
				return await client.instance.reply(from, guard.message, message);
			}

			for (const data of guard.data) {
				await client.instance.send(data.id, { text: data.message });
			}
		} else if (args[1] === 'vote') {
			const werewolf = new Werewolf(sender, args[3], client);
			const vote = werewolf.voteSomeone(sender, args[2], args[3]);

			if (vote.error && !('data' in vote)) {
				return await client.instance.reply(from, vote.message, message);
			}

			for (const data of vote.data) {
				await client.instance.send(data.id, { text: data.message });
			}

			client.instance.ev.emit('werewolf.cycle', {
				time: 'voted',
				id: args[3],
				text: `@${sender.split('@')[0]} voted for @${args[2].split('@')[0]}`,
				mentions: [args[2], sender],
				...client
			});
		} else if (args[1] === 'delete') {
			const werewolf = new Werewolf(sender, from, client);
			const deletes = werewolf.deleteGame(sender);

			return await client.instance.reply(from, deletes.message, message);
		} else if (args[1] === 'join') {
			sender = args[2] || sender;
			pushname = args[3] || pushname;

			const werewolf = new Werewolf(sender, from, client);
			const join = werewolf.werewolfJoin(sender, from, pushname);

			return join.error
				? client.instance.reply(from, join.message, message)
				: client.instance.send(
						from,
						{
							text: `${join.message}\n${join.mentions.map((v) => `@${v.split('@')[0]}`).join('\n')}`,
							mentions: join.mentions
						},
						{ quoted: message }
					);
		} else if (args[1] === 'newGame') {
			const werewolf = new Werewolf(sender, from, client);

			if (werewolf.getDataGame(from)) {
				await client.instance.send(
					from,
					{
						text: '\t',
						title: 'Sesi sudah ada di group ini. Pilih join untuk bergabung ke permainan',
						footer: 'Made by message Bot. Powered by Hidden Finder',
						buttonText: 'Open list',
						sections: row
					},
					{}
				);

				return;
			}

			new Werewolf(sender, from, client, pushname, true);

			const caption = 'Permainan Werewolf berhasil dibuat.';

			await client.instance.send(
				from,
				{
					text: '\t',
					buttonText: 'Open list',
					footer: 'Made by message Bot. Powered by Hidden Finder',
					title: `${caption}\nPilih salah satu.`,
					sections: row
				},
				{}
			);
		} else if (args[1] === 'exit') {
			const werewolf = new Werewolf(sender, from, client);
			const exit = werewolf.exitGame(sender, from);

			return await client.instance.reply(from, exit.message, message);
		} else if (args[1] === 'start') {
			const werewolf = new Werewolf(sender, from, client);
			const start = werewolf.startGame(sender, from);

			if (start.error) {
				return await client.instance.reply(from, start.message, message);
			}

			await client.instance.send(from, { text: start.message }, {});
			await client.instance.send(
				from,
				{
					text: `~ Player Werewolf ~\n\n${start.data.playersData
						.map((v, i) => `${i + 1}. @${v.id.split('@')[0]} | ${v.name}`)
						.join('\n')}`,
					mentions: start.data.playersData.map((v) => v.id)
				},
				{}
			);

			await delay(3000);

			await client.instance.send(from, { text: start.data.gameDialogue.replace('{0}', start.data.gameTime) }, {});

			for (const player of start.data.playersData) {
				if (player.role === 'villager') {
					client.instance.send(player.id, { text: player.dialogue });
				} else if (player.role === 'werewolf') {
					client.instance.send(player.id, {
						buttonText: 'Open list',
						footer: 'Made by message Bot. Powered by Hidden Finder',
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
											rowId: cmdId('ww', `kill ${start.data.playersData[i].id} ${from}`)
										}
									],
									title: 'message BOT | Werewolf Games'
								};
							})
					});
				} else if (player.role === 'seer') {
					client.instance.send(player.id, {
						buttonText: 'Open list',
						footer: 'Made by message Bot. Powered by Hidden Finder',
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
											rowId: cmdId('ww', `seer ${start.data.playersData[i].id} ${from}`)
										}
									],
									title: 'message BOT | Werewolf Games'
								};
							})
					});
				} else if (player.role === 'guard') {
					client.instance.send(player.id, {
						buttonText: 'Open list',
						footer: 'Made by message Bot. Powered by Hidden Finder',
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
											rowId: cmdId('ww', `guard ${start.data.playersData[i].id} ${from}`)
										}
									],
									title: 'message BOT | Werewolf Games'
								};
							})
					});
				}
			}

			start.data.startGameCycle(from, start.data.gameTimeCycle);
		} else {
			if (!isGroup) {
				return await client.instance.reply(from, 'This commands for group only', message);
			}

			const werewolfs = new Werewolf(sender, from, client);

			if (werewolfs.getDataGame(from) && !werewolfs.gameStarted) {
				await client.instance.send(
					from,
					{
						text: '\t',
						title: 'Sesi sudah ada di group ini. Pilih join untuk bergabung ke permainan',
						footer: 'Made by message Bot. Powered by Hidden Finder',
						buttonText: 'Open list',
						sections: row
					},
					{}
				);

				return;
			} else if (werewolfs.getDataGame(from) && werewolfs.gameStarted) {
				return await client.instance.reply(from, 'Sesi sudah ada di group ini dan permainan sudah dimulai.', message);
			}

			new Werewolf(sender, from, client, pushname, true);

			const caption = 'Permainan Werewolf berhasil dibuat.';

			await client.instance.send(
				from,
				{
					text: '\t',
					buttonText: 'Open list',
					footer: 'Made by message Bot. Powered by Hidden Finder',
					title: `${caption}\nPilih salah satu.`,
					sections: row
				},
				{}
			);
		}
	}
};
