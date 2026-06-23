import fs from 'fs-extra';

import { BOT_NAME } from '../../core/constants.js';
import configuration from '../../helper/config/connect.js';
import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
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
		const locale = await getLocale(from);
		const Lh = useLocale(locale, 'helper');
		const capt = `${Lh.labels.botName} : ${BOT_NAME}
${Lh.labels.totalCommands} : ${configuration.registry.commands.size}
${Lh.labels.botVersion} : ${botVersion}

${Lh.labels.ourMotto}

${Lh.labels.usingLessModule}`;

		const builder = new client.TemplateBuilder.Native();

		await builder
			.destination(from)
			.body(capt.formatForm())
			.footer(t(locale, 'owner.labels.poweredBy', [BOT_NAME]))
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
