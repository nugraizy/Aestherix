import { getTimeSince } from '../../utils/modules/index.js';
import { toUserJid } from '../../helper/misc/wa_data/index.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'tags',
	minifiedDescription: 'Fetch Tags',
	description: 'Fetch every tags',
	usage: '!tags',
	aliases: ['mytag', 'tagged'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	async run({ from, message, args, settings, cmd }, client, store) {
		const messages = store.loadMessages(from);

		if (args[1] === 'get') {
			/**
			 * @type {import('../../types/Reconstruct/index.js').ReassignResult}
			 */
			const dataMessage = await (
				await import('../../core/context.js')
			).Context.from(JSON.parse(JSON.stringify(messages.find((v) => v.key.id === args[2]))), client, store, false);

			await client.reply(dataMessage.from, 'Here.', dataMessage.message);
			await client.reply(
				dataMessage?.from,
				`Message Metadata : 

Possibly Hidetag : ${dataMessage.mention.length && !dataMessage.body.match(/@[0-9]+/g) ? 'Yup' : 'Nope'}
Type Message : ${dataMessage.type}
Tot. Tags : ${dataMessage.mention.length}`,
				dataMessage.message
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
					await import('../../core/context.js')
				).Context.from(JSON.parse(JSON.stringify(message)), client, store, false)
			);
		}

		if (!dataMessages.length) {
			return await client.reply(from, 'No messages scraped in this chat', message);
		}

		const ownerJid = toUserJid(settings.owner_number);

		dataMessages = dataMessages.filter(
			(v) =>
				(v.mediaData?.participant === ownerJid || v.mention.includes(ownerJid)) &&
				v.sender !== ownerJid
		);

		if (!dataMessages.length) {
			return await client.reply(from, `Your tags is not found. Chats scraped : ${messages.length}`, message);
		}

		dataMessages = dataMessages.map((v) => ({
			id: v.message.key.id,
			message: v.message,
			sender: v.sender,
			type:
				v.mention.includes(ownerJid) && (v.type === 'mentionText' || v.type === 'extendedTextMessage')
					? 'Tags & Reply'
					: v.mention.includes(ownerJid) && v.mediaData.participant !== ownerJid
						? 'Tags'
						: !v.mention.includes(ownerJid) && v.mediaData.participant === ownerJid
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

		await client.send(
			from,
			{
				buttonText: 'Open List',
				title: 'choosse one to fetch the metadata message',
				footer: 'and bot will send the message',
				text: '\t',
				sections: row
			},
			{}
		);
	}
});
