import fs from 'fs';

import configuration from '../../helper/config/connect.js';
import { getTimeSince } from '../../utils/modules/index.js';

const DB_PATH = `./src/media/connection_databases/${configuration.cli.input[0] ?? 'Session-debug'}.json`;

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'tags',
	minifiedDescription: 'Fetch Tags',
	description: 'Fetch every tags',
	usage: '!tags',
	aliases: ['mytag', 'tagged'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ from, message, args, settings, cmd, groupMetadata }, client, store) {
		const messages = configuration.OPTIONS.json
			? JSON.parse(fs.readFileSync(DB_PATH)).messages[from]
			: store.loadMessages(from);

		if (args[1] === 'get') {
			/**
			 * @type {import('../../types/Reconstruct/index.js').ReassignResult}
			 */
			const dataMessage = await (
				await import('../../helper/modules/parse-message.js')
			).reassign(JSON.parse(JSON.stringify(messages.find((v) => v.key.id === args[2]))), client, store, false);

			await client.instance.reply('Here.', {
				from: dataMessage.from,
				quoted: dataMessage.message,
				groupMetadata: dataMessage.groupMetadata
			});
			await client.instance.reply(
				`Message Metadata : 

Possibly Hidetag : ${dataMessage.mention.length > 0 && !dataMessage.body.match(/@[0-9]+/g) ? 'Yup' : 'Nope'}
Type Message : ${dataMessage.type}
Tot. Tags : ${dataMessage.mention.length}`,
				{ from: dataMessage?.from, quoted: dataMessage.message }
			);

			return;
		}

		/**
		 * @type {import('../../types/Reconstruct/index.js').ReassignResult[]}
		 */
		let dataMessages = [];

		for (const message of messages) {
			dataMessages.push(
				await (
					await import('../../helper/modules/parse-message.js')
				).reassign(JSON.parse(JSON.stringify(message)), client, store, false)
			);
		}

		if (dataMessages.length === 0) {
			return await client.instance.reply('No messages scraped in this chat', { from, quoted: message, groupMetadata });
		}

		dataMessages = dataMessages.filter(
			(v) =>
				(v.mediaData?.participant === settings.owner_number || v.mention.includes(settings.owner_number)) &&
				v.sender !== settings.owner_number
		);

		if (dataMessages.length === 0) {
			return await client.instance.reply(`Your tags is not found. Chats scraped : ${messages.length}`, {
				from,
				quoted: message,
				groupMetadata
			});
		}

		dataMessages = dataMessages.map((v) => ({
			id: v.message.key.id,
			message: v.message,
			sender: v.sender,
			type:
				v.mention.includes(settings.owner_number) && (v.type === 'mentionText' || v.type === 'extendedTextMessage')
					? 'Tags & Reply'
					: v.mention.includes(settings.owner_number) && v.mediaData.participant !== settings.owner_number
					? 'Tags'
					: !v.mention.includes(settings.owner_number) && v.mediaData.participant === settings.owner_number
					? 'Reply'
					: '',
			time: getTimeSince(Number(v.timeStamp) * 1000),
			pushName: v.pushname,
			media: v.type
		}));

		const row = [];
		let i = 0;

		for (const message of dataMessages.reverse()) {
			row.push({
				rows: [
					{
						title: `${i + 1}. ${message.type}, from ${message.pushName}`,
						rowId: `${cmd} get ${message.id}`
					}
				],
				title: `${message.time}`
			});
			i++;
		}

		await client.instance.send(
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
