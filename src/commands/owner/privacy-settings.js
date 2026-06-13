import { getBinaryNodeChild, getBinaryNodeChildren } from 'baileys';
import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';

const TYPES = {
	ALL: ['all', 'contacts', 'contact_blacklist', 'none'],
	MISC: ['known', 'match_last_seen']
};

const PRIVACY_SETTINGS_TOGGLE = {
	groupadd: TYPES.ALL.slice(0, -1),
	last: TYPES.ALL,
	status: TYPES.ALL,
	profile: [TYPES.ALL[0], TYPES.ALL[1], TYPES.ALL[3]],
	readreceipts: [TYPES.ALL[0], TYPES.ALL[3]],
	online: [TYPES.ALL[0], TYPES.MISC[1]],
	calladd: [TYPES.ALL[0], TYPES.MISC[0]]
};

const processPrivacySettings = (node) => {
	const privacy = getBinaryNodeChild(node, 'privacy');
	const category = getBinaryNodeChildren(privacy, 'category');

	if (!category) {
		return privacy;
	}

	return category;
};

const parseValidValue = (name, value) => {
	if (Object.keys(PRIVACY_SETTINGS_TOGGLE).includes(name)) {
		if (PRIVACY_SETTINGS_TOGGLE[name].includes(value)) {
			return value;
		}
	}

	return null;
};

const sendQuery = (client, { name, value }) =>
	client.query({
		tag: 'iq',
		attrs: {
			xmlns: 'privacy',
			type: 'set',
			to: '@s.whatsapp.net',
			id: client.generateMessageID()
		},
		content: [
			{
				tag: 'privacy',
				attrs: {},
				content: [
					{
						tag: 'category',
						attrs: {
							name,
							value
						},
						content: undefined
					}
				]
			}
		]
	});

export default defineCommand({
	name: 'privacy',
	description: 'Change the privacy settings of the bot.',
	usage: '!privacy `<setting>` `<value>`',
	aliases: ['prv'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	run: async ({ query, from, message }, client) => {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		try {
			const node = await client.query({
				tag: 'iq',
				attrs: {
					xmlns: 'privacy',
					type: 'get',
					to: '@s.whatsapp.net',
					id: client.generateMessageID()
				},
				content: [
					{
						tag: 'privacy',
						attrs: {},
						content: undefined
					}
				]
			});

			const result = processPrivacySettings(node);

			if (!query) {
				return await client.reply(
					from,
					`Privacy settings:\n${result
						.map((setting) => `${setting.attrs.name}: ${setting.attrs.value}`)
						.join('\n')}\n\nUsage: !privacy <setting> <value>\nValid Settings with Values: \n${Object.entries(
						PRIVACY_SETTINGS_TOGGLE
					)
						.map(([setting, values]) => `${setting}: ${values.join(', ')}`)
						.join('\n')}`,
					message
				);
			}

			const [name, value] = query.split(' ');

			const validValue = parseValidValue(name, value);

			if (!validValue) {
				return await client.reply(
					from,
					`Invalid value for ${name}. Valid values: ${PRIVACY_SETTINGS_TOGGLE[name].join(', ')}`,
					message
				);
			}

			await sendQuery(client, { name, query });

			await client.reply(from, L.simulate.privacySuccess, message);
		} catch {
			await client.reply(from, L.errors.error, message);
		}
	}
});
