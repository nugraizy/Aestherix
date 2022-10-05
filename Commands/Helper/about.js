/* global botNum */
import configuration from '../../connect.js';
import { readJSON, romanize } from '../../Helper/index.js';

export default {
	name: 'about',
	description: 'Shows the bot information',
	usage: '!about',
	aliases: ['info'],
	category: 'Helper',
	cooldown: 10,
	limit: 5,
	status: 'enable',
	async run({ from }, client) {
		const capt = `Bot Name : Void
Total Commands : ${configuration.cmds.commands.size}
Bot Version : ${romanize(readJSON('./package.json').version).toUpperCase()}
Bot Creator : Nanda
Github Uname : nugraizy
Github Repo : Currently not available (private)

Our Motto :

Using less module and try to find every private api from the provider (if they using one).`;

		await client[botNum].sendMessage(from, {
			text: capt.trim(),
			footer: 'Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪',
			templateButtons: [],
			headerType: 1,
		});
		await client[botNum].sendMessage(from, {
			text: `Thanks To :
Aldi a.k.a Alphanum404
Benni a.k.a Bennz
Hanif a.k.a Mrhrtz
Nafiz a.k.a VoIP
Toby a.k.a Tobz`,
			footer: 'Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪',
			templateButtons: [{ urlButton: { displayText: 'Contact Owner', url: 'https://wa.me/6289607055246?text=hi' } }],
			headerType: 1,
		});
	},
};
