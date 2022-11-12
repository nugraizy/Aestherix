/* global botNum */
import configuration from '../../connect.js';
import { readJSON } from '../../helper/modules/index.js';

const getRandomCommand = () => Array.from(configuration.cmds.commands.keys())[Math.floor(Math.random() * configuration.cmds.commands.size)];

export default {
	name: 'menu',
	description: 'Shows the menu',
	usage: '!menu',
	aliases: ['help'],
	category: 'Helper',
	cooldown: 10,
	limit: 5,
	status: 'enable',
	async run({ from, prefix, message }, client) {
		let capt = `𓆩 Void Bot ⁣𓆪\nV ${readJSON(
			'./package.json',
		).version.toUpperCase()}\n\nnote : if you want to try werewolf, the game still on beta, so many bugs (the game made in 2 days). but still playable.\n\n`;
		const container = [];

		for (const [key, value] of configuration.cmds.commands) {
			if (value.name === '') {
				continue;
			}

			if (Object.keys(container).includes(value.category)) {
				container[value.category].push(key);
			} else {
				container[value.category] = [key];
			}
		}

		for (const key of Object.keys(container).sort((a, b) => a.localeCompare(b))) {
			capt += `${key.toUpperCase()}\n\n${container[key]
				.sort((a, b) => a.localeCompare(b))
				.map((v) => ` ⋊ ${v}`)
				.join('\n')}\n\n\n`;
		}

		capt = `${capt.trim()}\n\nUse : ${prefix}${getRandomCommand()} -H\n~> to see the detail of the command.\n~> total command : ${configuration.cmds.commands.size}`;

		await client[botNum].sendMessage(
			from,
			{ text: capt.trim(), footer: 'Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪', buttons: [{ buttonId: '.about', buttonText: { displayText: 'About Us.' }, type: 1 }], headerType: 1 },
			{ quoted: message },
		);
	},
};
