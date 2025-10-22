import fs from 'fs-extra';

import configuration from '../../helper/config/connect.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'about',
	minifiedDescription: 'Bot Information',
	description: 'Shows the bot information',
	usage: '!about',
	aliases: ['info'],
	category: 'Helper',
	cooldown: 10,
	limit: 5,
	status: 'enable',
	async run({ from, message }, client) {
		const capt = `Bot Name : Void
Total Commands : ${configuration.cmds.commands.size}
Bot Version : ${(await fs.readJSON('./package.json')).version}
Bot Creator : Nanda
Github Username : nugraizy
Github Repo : Currently not available (private)

Our Motto :

Using less module and try to find every private api from the provider (if they using one).`;

		await client.instance.reply(from, capt.trim().formatForm(), message);
		await client.instance.reply(
			from,
			`Thanks To :
Aldi a.k.a Alphanum404
Benni a.k.a Bennz
Hanif a.k.a Mrhrtz
Nafiz a.k.a VoIP
Toby a.k.a Tobz

Powered by 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ`,
			message
		);
	}
};
