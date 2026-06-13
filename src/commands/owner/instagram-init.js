import configuration from '../../helper/config/connect.js';
import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { login } from '../../utils/instagram/login.js';
import { defineCommand } from '../_define.js';

const { InstagramApi } = await import('../../utils/instagram/instagram.js');

export default defineCommand({
	name: 'instagraminit',
	description: 'Initialize Instagram session.',
	usage: '!instagraminit',
	aliases: ['instainit'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	run: async ({ from, message }, client) => {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (configuration.isInstagramInitiated) {
			return await client.reply(from, L.errors.instagramAlreadyInit, message);
		}

		await login(process.env.INSTAGRAM_USERNAME, process.env.INSTAGRAM_PASSWORD);

		configuration.instagram = InstagramApi.init();

		configuration.isInstagramInitiated = true;

		return await client.reply(from, L.simulate.instaInitSuccess, message);
	}
});
