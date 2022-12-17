/* global botNum */
import fs from 'fs';

import configuration from '../../connect.js';
import { getTimeSince } from '../../helper/index.js';

const DB_PATH = `./media_files/connection_databases/${configuration.cli.input[0] ?? 'Session-debug'}.json`;

export default {
	name: 'tags',
	description: 'Fetch every tags',
	usage: '!tags',
	aliases: ['mytag', 'tagged'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ isOwner, from, message, args, settings, cmd }, client, store) {
		if (!isOwner) {
			return await client[botNum].reply({ from, quoted: message }, 'You are not allowed to use this command');
		}

		const messages = configuration.OPTIONS.json
			? JSON.parse(fs.readFileSync(DB_PATH)).messages[from]
			: await store.loadMessages(from);

		if (args[1] == 'get') {
			let dataMessage = messages.find((v) => v.key.id == args[2]);

			dataMessage = await (
				await import('../../helper/modules/reassign-messages-object.js')
			).reassign(JSON.parse(JSON.stringify(dataMessage)), client, store, false);
			await client[botNum].reply({ from: dataMessage?.from, quoted: dataMessage.message }, 'Here.');
			await client[botNum].reply(
				{ from: dataMessage?.from, quoted: dataMessage.message },
				`Message Metadata : 

Possibly Hidetag : ${dataMessage.mention.length > 0 && !dataMessage.body.match(/@[0-9]+/g) ? 'Yup' : 'Nope'}
Type Message : ${dataMessage.type}
Tot. Tags : ${dataMessage.mention.length}`,
			);

			return;
		}

		let dataMessages = [];

		for (const message of messages) {
			dataMessages.push(
				await (
					await import('../../helper/modules/reassign-messages-object.js')
				).reassign(JSON.parse(JSON.stringify(message)), client, store, false),
			);
		}

		if (dataMessages.length == 0) {
			return await client[botNum].reply({ from, quoted: message }, 'No messages scraped in this chat');
		}

		dataMessages = dataMessages.filter(
			(v) =>
				(v.mediaData?.participant == settings.owner_number || v.mention.includes(settings.owner_number)) &&
				v.sender !== settings.owner_number,
		);

		if (dataMessages.length == 0) {
			return await client[botNum].reply(
				{ from, quoted: message },
				`Your tags is not found. Chats scraped : ${messages.length}`,
			);
		}

		dataMessages = dataMessages.map((v) => {
			return {
				id: v.message.key.id,
				message: v.message,
				sender: v.sender,
				type:
					v.mention.includes(settings.owner_number) && (v.type == 'mentionText' || v.type == 'extendedTextMessage')
						? 'Tags & Reply'
						: v.mention.includes(settings.owner_number) && v.mediaData.participant !== settings.owner_number
						? 'Tags'
						: !v.mention.includes(settings.owner_number) && v.mediaData.participant == settings.owner_number
						? 'Reply'
						: '',
				time: getTimeSince(Number(v.timeStamp) * 1000),
				pushName: v.pushname,
				media: v.type,
			};
		});

		const row = [];
		let i = 0;

		for (const message of dataMessages.reverse()) {
			row.push({
				rows: [
					{
						title: `${i + 1}. ${message.type}, from ${message.pushName}`,
						rowId: `${cmd} get ${message.id}`,
					},
				],
				title: `${message.time}`,
			});
			i++;
		}

		await client[botNum].sendMessage(from, {
			buttonText: 'Open List',
			title: 'choosse one to fetch the metadata message',
			footer: 'and bot will send the message',
			text: '\t',
			sections: row,
		});
	},
};
