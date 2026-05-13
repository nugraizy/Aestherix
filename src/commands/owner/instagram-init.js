import configuration from '../../helper/config/connect.js';
import { login } from '../../utils/instagram/login.js';

		const { InstagramApi } = await import('../../utils/instagram/instagram.js');


/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'instagraminit',
	description: 'Initialize Instagram session.',
	usage: '!instagraminit',
	aliases: ['instainit'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	run: async ({ from, message }, client) => {
		if (configuration.isInstagramInitiated) {
			return await client.reply(from, 'Instagram session is already initialized.', message);
		}

		await login(process.env.INSTAGRAM_USERNAME, process.env.INSTAGRAM_PASSWORD);


		configuration.instagram = InstagramApi.init();

		configuration.isInstagramInitiated = true;

		return await client.reply(from, 'Instagram session has been initialized successfully.', message);
	}
};
