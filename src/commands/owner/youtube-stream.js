import { YTNodes } from 'youtubei.js';

import { youtubeLiveComments } from '../../utils/index.js';
import { color, loggers } from '../../utils/modules/index.js';
import { Cache } from '../../helper/modules/cache.js';
import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';

const lives = new Cache();

export default defineCommand({
	name: 'youtubelive',
	minifiedDescription: 'Live Stream Events',
	description: 'Listen to a YouTube live stream.',
	usage: '!youtubelive `<youtube_id>`',
	aliases: ['ytlive'],
	category: 'Owner',
	cooldown: 0,
	limit: 0,
	status: 'enable',
	run: async ({ from, message, query, args }, client) => {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (!query) {
			return client.reply(from, L.errors.noQuery, message);
		}

		if (args[1] === 'stop') {
			const live = lives.get(from);

			if (!live) {
				return client.reply(from, L.errors.noLiveStream, message);
			}

			live.stop();

			return client.reply(from, L.info.streamStopped, message);
		} else if (args[1] === 'start') {
			const live = lives.get(from);

			if (!live) {
				return client.reply(from, L.errors.noLiveStream, message);
			}

			live.start();

			return client.reply(from, L.info.streamStarted, message);
		}

		const live = await youtubeLiveComments(query);

		if (live?.error) {
			return client.reply(from, live.error, message);
		}

		lives.set(from, live);

		live.on('start', async (initialData) => {
			try {
				await client.reply(from, L.info.streamJoined, message);

				const pinnedAction = initialData.actions.firstOfType(YTNodes.AddBannerToLiveChatCommand);

				if (pinnedAction) {
					if (pinnedAction.banner?.contents?.is(YTNodes.LiveChatTextMessage)) {
						await client.reply(
							from,
							`${'Live Stream Info'.formatHeaders()}

Info : Pinned Message
From : ${pinnedAction.banner.contents.author?.name.toString()}
Content : ${pinnedAction?.banner.contents.message.toString()}`,
							message
						);
					}
				}
			} catch (error) {
				loggers.error(color('YouTube stream failed:', 'red'), error);
			}
		});

		live.on('error', async () => {
			await client.reply(from, L.errors.somethingWentWrong, message);

			try {
				live.stop();
			} catch (error) {
				loggers.error(color('YouTube stream failed:', 'red'), error);
			}

			lives.delete(from);
		});

		live.on('end', async () => {
			try {
				await client.reply(from, L.info.liveStreamEnded, message);

				live.stop();
				lives.delete(from);
			} catch (error) {
				loggers.error(color('YouTube stream failed:', 'red'), error);
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

							await client.send(
								from,
								{
									text: `${'Live Stream Message Info'.formatHeaders()}

[${hours}] : ${item.as(YTNodes.LiveChatTextMessage).author?.is_moderator ? '[MOD] ' : ''}\`\`\`${item
										.as(YTNodes.LiveChatTextMessage)
										.author.name.toString()}\`\`\`
MSG ~> ${item.as(YTNodes.LiveChatTextMessage).message.toString()}`.trim()
								},
								{}
							);
							break;
						case 'LiveChatPaidMessage':
							await client.send(
								from,
								{
									text: `${'Live Stream Donation Info'.formatHeaders()}

[${hours}] : ${item.as(YTNodes.LiveChatPaidMessage).author?.is_moderator ? '[MOD] ' : ''}\`\`\`${item
										.as(YTNodes.LiveChatPaidMessage)
										.author.name.toString()}\`\`\`
(${item.as(YTNodes.LiveChatPaidMessage).purchase_amount})
MSG ~> ${item.as(YTNodes.LiveChatPaidMessage).message.toString()}`.trim()
								},
								{}
							);
							break;
						case 'LiveChatPaidSticker':
							await client.send(
								from,

								{
									text: `${'Live Stream Donation Info'.formatHeaders()}

[${hours}] : ${item.as(YTNodes.LiveChatPaidSticker).author?.is_moderator ? '[MOD]' : ''}\`\`\`${item
										.as(YTNodes.LiveChatPaidSticker)
										.author.name.toString()}\`\`\`
(${item.as(YTNodes.LiveChatPaidSticker).purchase_amount})`.trim()
								},
								{}
							);
							break;
						default:
							break;
					}
				}

				if (action.is(YTNodes.AddBannerToLiveChatCommand)) {
					await client.send(
						from,
						{
							text: `${'Live Stream Info'.formatHeaders()}

Info : Message Just Got Pinned
Content : ${action.banner?.contents}`
						},
						{}
					);
				}
			} catch (error) {
				loggers.error(color('YouTube stream failed:', 'red'), error);
			}
		});

		live.on('metadata-update', async (metadata) => {
			try {
				await client.send(
					from,
					{
						text: `${'Live Stream Metadata'.formatHeaders()}

Views : ${metadata.views?.view_count.toString()} 👀
Likes : ${metadata.likes?.default_text} 👍🏻`
					},
					{}
				);
			} catch (error) {
				loggers.error(color('YouTube stream failed:', 'red'), error);
			}
		});

		live.start();
	}
});
