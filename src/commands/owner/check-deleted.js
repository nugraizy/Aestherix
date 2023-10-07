import fs from 'fs';

import configuration from '../../helper/config/connect.js';
import { getTimeSince } from '../../utils/modules/index.js';
import { Cache } from '../../helper/modules/cache.js';

const DB_PATH = `./src/media/connection_databases/${configuration.cli.input[0] ?? 'Session-debug'}.json`;

const path = {
	deleted: '../../handlers/messages_event/deleted-message.js'
};
const handler = new Cache();

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'checkdeleted',
	description: 'Fetch every deleted messages in chat',
	usage: '!checkdeleted',
	aliases: ['cekdel', 'checkdel'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ isOwner, from, message, args, cmd, groupMetadata }, client, store) {
		if (!isOwner) {
			return await client[botNum].reply('You are not allowed to use this command', { from, quoted: message, groupMetadata });
		}

		const messages = configuration.OPTIONS.json
			? JSON.parse(fs.readFileSync(DB_PATH)).messages[from]
			: await store.loadMessages(from);

		if (args[1] === 'get') {
			const dataMessage = messages.find((v) => v.key.id === args[2]);

			if (!handler.has('deleted')) {
				handler.set('deleted', (await import(path.deleted)).default);
			}

			handler.get('deleted')(client, dataMessage, true, store);
			return;
		}

		const dataMessages = messages.filter((v) => v.message?.protocolMessage && v.message.protocolMessage.type === 'REVOKE');
		const row = [];
		let i = 0;

		for (const message of dataMessages) {
			row.push({
				rows: [
					{
						title: `${i + 1}. ${message.pushName.substr(0, 5)} ${getTimeSince(Number(message.messageTimestamp) * 1000)}`,
						rowId: `${cmd} get ${message.message.protocolMessage.key.id}`
					}
				],
				title: `VOID BOT | ${message?.pushName ?? 'No Name'}`
			});
			i++;
		}

		await client[botNum].send(
			from,
			{
				buttonText: 'Open List',
				title: 'choosse one to fetch the metadata message',
				footer: 'and bot will send the message',
				text: '\t',
				sections: row
			},
			{ groupMetadata }
		);
	}
};
