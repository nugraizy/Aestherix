import { generateMessageID, getBinaryNodeChild, getBinaryNodeChildren } from 'baileys';

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
	client.instance.query({
		tag: 'iq',
		attrs: {
			xmlns: 'privacy',
			type: 'set',
			to: '@s.whatsapp.net',
			id: generateMessageID()
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

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'privacy',
	description: 'Change the privacy settings of the bot.',
	usage: '!privacy <setting> <value>',
	aliases: ['prv'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	run: async ({ query, from, message, groupMetadata }, client) => {
		try {
			const node = await client.instance.query({
				tag: 'iq',
				attrs: {
					xmlns: 'privacy',
					type: 'get',
					to: '@s.whatsapp.net',
					id: generateMessageID()
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
				return await client.instance.reply(
					`Privacy settings:\n${result
						.map((setting) => `${setting.attrs.name}: ${setting.attrs.value}`)
						.join('\n')}\n\nUsage: !privacy <setting> <value>\nValid Settings with Values: \n${Object.entries(
						PRIVACY_SETTINGS_TOGGLE
					)
						.map(([setting, values]) => `${setting}: ${values.join(', ')}`)
						.join('\n')}`,
					{
						from,
						quoted: message,
						groupMetadata
					}
				);
			}

			const [name, value] = query.split(' ');

			const validValue = parseValidValue(name, value);

			if (!validValue) {
				return await client.instance.reply(
					`Invalid value for ${name}. Valid values: ${PRIVACY_SETTINGS_TOGGLE[name].join(', ')}`,
					{
						from,
						quoted: message,
						groupMetadata
					}
				);
			}

			await sendQuery(client, { name, query });

			await client.instance.reply('Succesfully changed privacy settings.', {
				from,
				quoted: message,
				groupMetadata
			});
		} catch {
			await client.instance.reply('An error occured while trying to change privacy settings.', {
				from,
				quoted: message,
				groupMetadata
			});
		}
	}
};
