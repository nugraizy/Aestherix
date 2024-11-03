import fs from 'fs-extra';

import configuration from '../../helper/config/connect.js';
import { romanize } from '../../utils/index.js';

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
Bot Version : ${romanize((await fs.readJSON('./package.json')).version).toUpperCase()}
Bot Creator : Nanda
Github Uname : nugraizy
Github Repo : Currently not available (private)

Our Motto :

Using less module and try to find every private api from the provider (if they using one).`;

		await client.instance.reply(capt.trim().formatForm(), { from, quoted: message });
		await client.instance.reply(
			`Thanks To :
Aldi a.k.a Alphanum404
Benni a.k.a Bennz
Hanif a.k.a Mrhrtz
Nafiz a.k.a VoIP
Toby a.k.a Tobz

Powered by 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ`,
			{ from, quoted: message }
		);
	}
};
