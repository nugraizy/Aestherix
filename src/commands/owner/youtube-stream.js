import { YTNodes } from 'youtubei.js';

import { youtubeLiveComments } from '../../utils/index.js';
import { Cache } from '../../helper/modules/cache.js';

const lives = new Cache();

/**
 * @type {import('../../types/Commands/index.js').CommandProps}
 */
export default {
	name: 'youtubelive',
	description: 'Listen to a YouTube live stream.',
	usage: '!youtubelive <youtube_id>',
	aliases: ['ytlive'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	run: async ({ from, message, query, groupMetadata, args }, client) => {
		if (!query) {
			return client[botNum].reply('You must provide a query.', { from, quoted: message, groupMetadata });
		}

		if (args[1] === 'stop') {
			const live = lives.get(from);

			if (!live) {
				return client[botNum].reply('No live stream is running.', { from, quoted: message, groupMetadata });
			}

			live.stop();

			return client[botNum].reply('Live stream has been stopped.', { from, quoted: message, groupMetadata });
		} else if (args[1] === 'start') {
			const live = lives.get(from);

			if (!live) {
				return client[botNum].reply('No live stream is running.', { from, quoted: message, groupMetadata });
			}

			live.start();

			return client[botNum].reply('Live stream has been started.', { from, quoted: message, groupMetadata });
		}

		const live = await youtubeLiveComments(query);

		if ('error' in live) {
			return client[botNum].reply(live.error, { from, quoted: message, groupMetadata });
		}

		lives.set(from, live);

		live.on('start', async (initialData) => {
			try {
				await client[botNum].reply('Success join the live stream.', { from, quoted: message, groupMetadata });

				const pinnedAction = initialData.actions.firstOfType(YTNodes.AddBannerToLiveChatCommand);

				if (pinnedAction) {
					if (pinnedAction.banner?.contents?.is(YTNodes.LiveChatTextMessage)) {
						client[botNum].reply(
							`${'Live Stream Info'.formatHeaders()}
    
Info : Pinned Message
From : ${pinnedAction.banner.contents.author?.name.toString()}
Content : ${pinnedAction?.banner.contents.message.toString()}`,
							{ from, quoted: message, groupMetadata }
						);
					}
				}
			} catch (error) {
				console;
			}
		});

		live.on('error', async () => {
			await client[botNum].reply('Something went wrong with the socket.', { from, quoted: message, groupMetadata });

			try {
				live.stop();
			} catch {
				console;
			}

			lives.delete(from);
		});

		live.on('end', async () => {
			try {
				await client[botNum].reply('The live stream has ended.', { from, quoted: message, groupMetadata });

				live.stop();
				lives.delete(from);
			} catch (error) {
				console;
			}
		});

		live.on('chat-update', async (action) => {
			try {
				if (action.is(YTNodes.AddChatItemAction)) {
					const item = action.as(YTNodes.AddChatItemAction).item;

					if (!item) {
						return;
					}

					const hours = new Date(item.hasKey('timestamp') ? item.timestamp : Date.now()).toLocaleTimeString('en-US', {
						hour: '2-digit',
						minute: '2-digit'
					});

					switch (item.type) {
						case 'LiveChatTextMessage':
							if (item.as(YTNodes.LiveChatTextMessage).message.toString().startsWith('UCZL')) {
								return;
							}

							await client[botNum].send(
								from,
								{
									text: `${'Live Stream Message Info'.formatHeaders()}

[${hours}] : ${item.as(YTNodes.LiveChatTextMessage).author?.is_moderator ? '[MOD] ' : ''}\`\`\`${item
										.as(YTNodes.LiveChatTextMessage)
										.author.name.toString()}\`\`\`
MSG ~> ${item.as(YTNodes.LiveChatTextMessage).message.toString()}`.trim()
								},
								{
									groupMetadata
								}
							);
							break;
						case 'LiveChatPaidMessage':
							await client[botNum].send(
								from,
								{
									text: `${'Live Stream Donation Info'.formatHeaders()}

[${hours}] : ${item.as(YTNodes.LiveChatPaidMessage).author?.is_moderator ? '[MOD] ' : ''}\`\`\`${item
										.as(YTNodes.LiveChatPaidMessage)
										.author.name.toString()}\`\`\`
(${item.as(YTNodes.LiveChatPaidMessage).purchase_amount})
MSG ~> ${item.as(YTNodes.LiveChatPaidMessage).message.toString()}`.trim()
								},
								{ groupMetadata }
							);
							break;
						case 'LiveChatPaidSticker':
							await client[botNum].send(
								from,

								{
									text: `${'Live Stream Donation Info'.formatHeaders()}

[${hours}] : ${item.as(YTNodes.LiveChatPaidSticker).author?.is_moderator ? '[MOD]' : ''}\`\`\`${item
										.as(YTNodes.LiveChatPaidSticker)
										.author.name.toString()}\`\`\`
(${item.as(YTNodes.LiveChatPaidSticker).purchase_amount})`.trim()
								},
								{ groupMetadata }
							);
							break;
						default:
							break;
					}
				}

				if (action.is(YTNodes.AddBannerToLiveChatCommand)) {
					await client[botNum].send(
						from,
						{
							text: `${'Live Stream Info'.formatHeaders()}

Info : Message Just Got Pinned
Content : ${action.banner?.contents}`
						},
						{ groupMetadata }
					);
				}
			} catch (error) {
				console;
			}
		});

		live.on('metadata-update', async (metadata) => {
			try {
				await client[botNum].send(
					from,
					{
						text: `${'Live Stream Metadata'.formatHeaders()}

Views : ${metadata.views?.view_count.toString()} 👀
Likes : ${metadata.likes?.default_text} 👍🏻`
					},
					{ groupMetadata }
				);
			} catch (error) {
				console;
			}
		});

		live.start();
	}
};
