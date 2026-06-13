import { createImage } from '../../utils/ai/index.js';
import { defineCommand } from '../_define.js';
import { getLocale, useLocale } from '../../helper/i18n/index.js';

export default defineCommand({
	name: 'makeimage',
	minifiedDescription: 'Create Image',
	description: 'Create an image based on your description',
	usage: '!makeimage `<scenario>`',
	category: 'Converter',
	aliases: ['createimage', 'makeimg', 'createimg'],
	limit: 2,
	cooldown: 5,
	status: 'disable',
	async run({ query, from, message }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return await client.reply(from, L.errors.noQuery, message);
		}

		await client.reply(from, L.success.loading, message);

		const result = await createImage(query);

		const caption = `${'A.I Image Generator'.formatHeaders()}\n\nPowered by deepai.org`;

		await client.send(from, { image: { url: result }, caption }, { quoted: message });
	}
});
