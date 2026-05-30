import fs from 'fs-extra';

import { BOT_NAME } from '../../core/constants.js';
import configuration from '../../helper/config/connect.js';
import { defineCommand } from '../_define.js';

const botVersion = (await fs.readJSON('./package.json')).version;

export default defineCommand({
	name: 'about',
	minifiedDescription: 'Bot Information',
	description: 'Shows the bot information',
	usage: '!about',
	aliases: ['info'],
	category: 'Helper',
	cooldown: 10,
	limit: 5,
	status: 'enable',
	async run({ from }, client) {
		const capt = `Bot Name : ${BOT_NAME}
Total Commands : ${configuration.registry.commands.size}
Bot Version : ${botVersion}

Our Motto :

Using less module and try to find every private api from the provider (if they using one).`;

		const builder = new client.TemplateBuilder.Native();

		await builder
			.destination(from)
			.body(capt.formatForm())
			.footer('Powered by ' + BOT_NAME)
			.buttons(
				builder.button.url({ display: 'Nanda', url: 'https://github.com/nugraizy' }),
				builder.button.url({ display: 'Aldi', url: 'https://github.com/alphanum404' }),
				builder.button.url({ display: 'Tobi', url: 'https://github.com/alphanum404' }),
				builder.button.url({ display: 'Aruga', url: 'https://github.com/arugaz' }),
				builder.button.url({ display: '───────────────', url: '' }),
				builder.button.url({ display: 'Source', url: 'https://github.com/nugraizy/aestherix' })
			)
			.send();
	}
});
