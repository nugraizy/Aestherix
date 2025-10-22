import fs from 'fs-extra';

import configuration from '../../helper/config/connect.js';
import { S_WHATSAPP_NET, Limit } from '../../helper/index.js';

const configureUser = async (client, { mode, user, USERS, PREMS_CONTAINER, from, message }) => {
	const index = USERS.findIndex((v) => v.id === user);

	if (index === -1) {
		await client.instance.send(
			from,
			{ text: `User @${user.replace(/[^\d]/g, '')} not found`, mentions: [user] },
			{ from, quoted: message }
		);
	}

	if (mode === 'add') {
		if (USERS[index].role === 'PREMIUM') {
			return await client.instance.send(
				from,
				{ text: `User @${user.replace(/[^\d]/g, '')} is already premium`, mentions: [user] },
				{ from, quoted: message }
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
				{ from, quoted: message }
			);
		}

		USERS[index].role = 'FREE';
		await fs.writeJSON('./databases/users/limit.json', USERS, { spaces: 4 });
		PREMS_CONTAINER.removing.push(user);
		Limit.updateRole(user, 'FREE');
	}

	if (PREMS_CONTAINER.adding.length || PREMS_CONTAINER.removing.length) {
		let capt = '';

		if (PREMS_CONTAINER.adding.length) {
			capt += `Success adding premium : ${PREMS_CONTAINER.adding.map((v) => `@${v.split('@')[0]}`).join(', ')}\n`;
		}

		if (PREMS_CONTAINER.removing.length) {
			capt += `Success removing premium : ${PREMS_CONTAINER.removing.map((v) => `@${v.split('@')[0]}`).join(', ')}`;
		}

		await client.instance.send(
			from,
			{ text: capt.trim(), mentions: [].concat(PREMS_CONTAINER.adding, PREMS_CONTAINER.removing) },
			{ quoted: message }
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
	usage: '!premium `(add/remove)` `<tag/reply user>`',
	aliases: ['prem'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ from, message, args, mediaData, mention, bodyQuoted, query }, client) {
		if (!query && bodyQuoted) {
			return await client.instance.reply(from, 'Please provide user to ban', message);
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
			return await client.instance.reply(from, 'Please provide params.\n!prem add/remove [tag/reply]', message);
		}

		if (!['add', 'remove'].includes(configure)) {
			return await client.instance.reply(from, 'Please provide params.\n!prem add/remove [tag/reply]', message);
		}

		if (mention.length) {
			for (const mentioned of mention) {
				await configureUser(client, {
					mode: configure,
					user: mentioned,
					USERS,
					PREMS_CONTAINER,
					from,
					message
				});
			}

			return;
		}

		if (query) {
			const numbers = query.parseNumber();

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
					message
				});
			}

			return;
		}

		if (bodyQuoted) {
			if (configure === 'add') {
				const mentioned = mediaData.participant;

				if (mentioned === configuration.botNumber) {
					return await client.instance.reply(from, 'Cannot add bot as premium', message);
				}

				const index = USERS.findIndex((v) => v.id === mentioned);

				if (index === -1) {
					return await client.instance.reply(from, 'User not found', message);
				}

				if (USERS[index].role === 'PREMIUM') {
					return await client.instance.reply(from, 'User already premium', message);
				}

				USERS[index].role = 'PREMIUM';
				await fs.writeJSON('./databases/users/limit.json', USERS, { spaces: 4 });
				PREMS_CONTAINER.adding.push(mentioned);
			}

			if (configure === 'remove') {
				const mentioned = mediaData.participant;

				if (mentioned === configuration.botNumber) {
					return await client.instance.reply(from, 'Cannot remove bot as premium', message);
				}

				const index = USERS.findIndex((v) => v.id === mentioned);

				if (index === -1) {
					return await client.instance.reply(from, 'User not found', message);
				}

				if (USERS[index].role === 'FREE') {
					return await client.instance.reply(from, 'User already user', message);
				}

				USERS[index].role = 'FREE';
				await fs.writeJSON('./databases/users/limit.json', USERS, { spaces: 4 });
				PREMS_CONTAINER.removing.push(mentioned);
			}

			if (PREMS_CONTAINER.adding.length || PREMS_CONTAINER.removing.length) {
				let capt = '';

				if (PREMS_CONTAINER.adding.length) {
					capt += `Success adding premium : ${PREMS_CONTAINER.adding.map((v) => `@${v.split('@')[0]}`).join(', ')}\n`;
				}

				if (PREMS_CONTAINER.removing.length) {
					capt += `Success removing premium : ${PREMS_CONTAINER.removing.map((v) => `@${v.split('@')[0]}`).join(', ')}`;
				}

				await client.instance.send(
					from,
					{ text: capt.trim(), mentions: [].concat(PREMS_CONTAINER.adding, PREMS_CONTAINER.removing) },
					{ quoted: message }
				);
			}
		}
	}
};
