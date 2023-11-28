import { findPhoneNumbersInText } from 'libphonenumber-js';
import fs from 'fs-extra';

import configuration from '../../helper/config/connect.js';
import { S_WHATSAPP_NET, Limit } from '../../helper/index.js';

const configureUser = async (client, { mode, user, USERS, PREMS_CONTAINER, from, message, groupMetadata }) => {
	const index = USERS.findIndex((v) => v.id === user);

	if (index === -1) {
		await client.instance.send(
			from,
			{ text: `User @${user.replace(/[^\d]/g, '')} not found`, mentions: [user] },
			{ from, quoted: message, groupMetadata }
		);
	}

	if (mode === 'add') {
		if (USERS[index].role === 'PREMIUM') {
			return await client.instance.send(
				from,
				{ text: `User @${user.replace(/[^\d]/g, '')} is already premium`, mentions: [user] },
				{ from, quoted: message, groupMetadata }
			);
		}

		USERS[index].role = 'PREMIUM';
		await fs.writeJSON('./databases/users/limit.json', USERS, { spaces: 4 });
		PREMS_CONTAINER.adding.push(user);
		Limit.updateRole(user, 'PREMIUM');
	}

	if (mode === 'remove') {
		if (USERS[index].role === 'FREE') {
			return await client.instance.send(
				from,
				{ text: `User @${user.replace(/[^\d]/g, '')} is already user`, mentions: [user] },
				{ from, quoted: message, groupMetadata }
			);
		}

		USERS[index].role = 'FREE';
		await fs.writeJSON('./databases/users/limit.json', USERS, { spaces: 4 });
		PREMS_CONTAINER.removing.push(user);
		Limit.updateRole(user, 'FREE');
	}

	if (PREMS_CONTAINER.adding.length > 0 || PREMS_CONTAINER.removing.length > 0) {
		let capt = '';

		if (PREMS_CONTAINER.adding.length > 0) {
			capt += `Success adding premium : ${PREMS_CONTAINER.adding.map((v) => `@${v.split('@')[0]}`).join(', ')}\n`;
		}

		if (PREMS_CONTAINER.removing.length > 0) {
			capt += `Success removing premium : ${PREMS_CONTAINER.removing.map((v) => `@${v.split('@')[0]}`).join(', ')}`;
		}

		await client.instance.send(
			from,
			{ text: capt.trim(), mentions: [].concat(PREMS_CONTAINER.adding, PREMS_CONTAINER.removing) },
			{ groupMetadata, quoted: message }
		);
	}
};

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'premium',
	minifiedDescription: 'Configure Users',
	description: 'Configure users status.',
	usage: '!premium (add/remove) <tag/reply>',
	aliases: ['prem'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ from, message, args, mediaData, mention, bodyQuoted, query, groupMetadata }, client) {
		if (!query && bodyQuoted) {
			return await client.instance.reply('Please provide user to ban', { from, quoted: message, groupMetadata });
		}

		/**
		 * @type {string[]}
		 */
		const USERS = await fs.readJSON('./databases/users/limit.json');
		const PREMS_CONTAINER = {
			adding: [],
			removing: []
		};

		const configure = args[1];

		if (!configure) {
			return await client.instance.reply('Please provide params.\n!prem add/remove [tag/reply]', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		if (!['add', 'remove'].includes(configure)) {
			return await client.instance.reply('Please provide params.\n!prem add/remove [tag/reply]', {
				from,
				quoted: message,
				groupMetadata
			});
		}

		if (mention.length > 0) {
			for (const mentioned of mention) {
				await configureUser(client, {
					mode: configure,
					user: mentioned,
					USERS,
					PREMS_CONTAINER,
					from,
					message,
					groupMetadata
				});
			}

			return;
		}

		if (query) {
			const numbers = findPhoneNumbersInText(query);

			for (let user of numbers) {
				let {
					number: { number }
				} = user;

				number = number.replace(/[^\d]/g, '');

				await configureUser(client, {
					mode: configure,
					user: `${number}@${S_WHATSAPP_NET}`,
					USERS,
					PREMS_CONTAINER,
					from,
					message,
					groupMetadata
				});
			}

			return;
		}

		if (bodyQuoted) {
			if (configure === 'add') {
				const mentioned = mediaData.participant;

				if (mentioned === configuration.botNumber) {
					return await client.instance.reply('Cannot add bot as premium', { from, quoted: message, groupMetadata });
				}

				const index = USERS.findIndex((v) => v.id === mentioned);

				if (index === -1) {
					return await client.instance.reply('User not found', { from, quoted: message, groupMetadata });
				}

				if (USERS[index].role === 'PREMIUM') {
					return await client.instance.reply('User already premium', { from, quoted: message, groupMetadata });
				}

				USERS[index].role = 'PREMIUM';
				await fs.writeJSON('./databases/users/limit.json', USERS, { spaces: 4 });
				PREMS_CONTAINER.adding.push(mentioned);
			}

			if (configure === 'remove') {
				const mentioned = mediaData.participant;

				if (mentioned === configuration.botNumber) {
					return await client.instance.reply('Cannot remove bot as premium', { from, quoted: message, groupMetadata });
				}

				const index = USERS.findIndex((v) => v.id === mentioned);

				if (index === -1) {
					return await client.instance.reply('User not found', { from, quoted: message, groupMetadata });
				}

				if (USERS[index].role === 'FREE') {
					return await client.instance.reply('User already user', { from, quoted: message, groupMetadata });
				}

				USERS[index].role = 'FREE';
				await fs.writeJSON('./databases/users/limit.json', USERS, { spaces: 4 });
				PREMS_CONTAINER.removing.push(mentioned);
			}

			if (PREMS_CONTAINER.adding.length > 0 || PREMS_CONTAINER.removing.length > 0) {
				let capt = '';

				if (PREMS_CONTAINER.adding.length > 0) {
					capt += `Success adding premium : ${PREMS_CONTAINER.adding.map((v) => `@${v.split('@')[0]}`).join(', ')}\n`;
				}

				if (PREMS_CONTAINER.removing.length > 0) {
					capt += `Success removing premium : ${PREMS_CONTAINER.removing.map((v) => `@${v.split('@')[0]}`).join(', ')}`;
				}

				await client.instance.send(
					from,
					{ text: capt.trim(), mentions: [].concat(PREMS_CONTAINER.adding, PREMS_CONTAINER.removing) },
					{ groupMetadata, quoted: message }
				);
			}
		}
	}
};
