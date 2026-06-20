import languages from '../../i18n/languages.js';
import { getLocale, setLocale, setUserLocale, useLocale } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';

const validIsos = new Set(languages.map((l) => l.iso));

export default defineCommand({
	name: 'lang',
	minifiedDescription: 'Change bot language',
	description: 'Change or view the bot language. In groups: per-group. In DM: per-user.',
	category: 'Misc',
	usage: '!lang `<iso>` or !lang list',
	aliases: ['language', 'bahasa'],
	limit: 0,
	cooldown: 3,
	status: 'enable',
	async run({ message, from, isGroup, args, sender }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		const sub = args?.[1]?.toLowerCase();

		if (sub === 'list') {
			const list = languages.map((l) => `• ${l.iso} — ${l.lang} (${l.native})`).join('\n');

			return await client.reply(from, `${L.info.langList}\n\n${list}`, message);
		}

		if (!sub) {
			const current = languages.find((l) => l.iso === locale);

			return await client.reply(
				from,
				L.info.langChanged.replace('{0}', current ? `${current.lang} (${current.iso})` : locale),
				message
			);
		}

		const target = sub.toLowerCase();

		if (!validIsos.has(target)) {
			const valid = languages.map((l) => l.iso).join(', ');

			return await client.reply(from, L.info.langInvalid.replace('{0}', valid), message);
		}

		if (isGroup) {
			await setLocale(from, target);
		} else {
			const userId = sender ?? from;

			await setUserLocale(userId, target);
		}

		const newL = useLocale(target, 'common');
		const lang = languages.find((l) => l.iso === target);

		await client.reply(from, newL.info.langChanged.replace('{0}', lang ? `${lang.lang} (${lang.iso})` : target), message);
	}
});
