import { downloadMediaMessage } from 'baileys';
import configuration from '../../helper/config/connect.js';
import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { updateGroupSetting } from '../../helper/database/adapters/group-settings.js';
import prisma from '../../helper/database/prisma.js';
import { defineCommand } from '../_define.js';

export default defineCommand({
	name: 'viewonce',
	minifiedDescription: 'Read view-once media or toggle auto-decrypt',
	description: 'Download view-once media or toggle auto-decrypt for the group.',
	usage: '!viewonce (reply to a view-once message) or !viewonce toggle',
	category: 'Moderation',
	aliases: ['vo', 'rvo'],
	cooldown: 5,
	limit: 1,
	status: 'enable',
	async run({ from, message, mediaData, isAdmin, isGroup, args }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');

		if (isGroup && !isAdmin) {
			return await client.reply(from, L.errors.adminOnly, message);
		}

		const sub = args?.[1]?.toLowerCase();

		if (sub === 'toggle') {
			if (!isGroup) {
				return await client.reply(from, L.errors.groupOnly, message);
			}

			const cached = configuration.groups.settings.get(from);
			const current = cached?.viewonce || 'disable';
			const next = current === 'enable' ? 'disable' : 'enable';

			await updateGroupSetting(prisma, from, 'viewonce', next);
			configuration.groups.settings.set(from, { ...(cached || {}), viewonce: next });

			return await client.reply(from, `View-once auto-decrypt: ${next}`, message);
		}

		if (!mediaData.message.imageMessage && !mediaData.message.videoMessage && !mediaData.message.audioMessage) {
			return await client.reply(from, L.errors.mediaRequired, message);
		}

		const buffer = await downloadMediaMessage({ message: mediaData.message }, 'buffer', {});

		const isVideo = !!mediaData.message.videoMessage;
		const isAudio = !!mediaData.message.audioMessage;

		await client.send(from, {
			[isVideo ? 'video' : isAudio ? 'audio' : 'image']: buffer
		});
	}
});
