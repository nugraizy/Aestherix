import fs from 'fs-extra';

import configuration from '../../helper/config/connect.js';
import { romanize } from '../../utils/index.js';

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'about',
	description: 'Shows the bot information',
	usage: '!about',
	aliases: ['info'],
	category: 'Helper',
	cooldown: 10,
	limit: 5,
	status: 'enable',
	async run({ from, groupMetadata, message }, client) {
		const capt = `Bot Name : Void
Total Commands : ${configuration.cmds.commands.size}
Bot Version : ${romanize((await fs.readJSON('./package.json')).version).toUpperCase()}
Bot Creator : Nanda
Github Uname : nugraizy
Github Repo : Currently not available (private)

Our Motto :

Using less module and try to find every private api from the provider (if they using one).`;

		await client[botNum].reply(capt.trim(), { from, quoted: message, groupMetadata });
		await client[botNum].reply(
			`Thanks To :
Aldi a.k.a Alphanum404
Benni a.k.a Bennz
Hanif a.k.a Mrhrtz
Nafiz a.k.a VoIP
Toby a.k.a Tobz

Powered by 𓆩 𝚮ɪᴅᴅᴇɴ 𝐅ɪɴᴅᴇʀ ⁣𓆪`,
			{ from, quoted: message, groupMetadata }
		);
	}
};
