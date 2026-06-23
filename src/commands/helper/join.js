import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { cmdId } from '../../helper/modules/prefix.js';
import { defineCommand } from '../_define.js';

const regex = (input) => {
	const regex = /^(?:https?:\/\/)?(?:chat\.)?(?:whatsapp\.com)\/([\d\w]{21,23})/;

	if (!regex.test(input)) {
		return false;
	}

	const match = regex.exec(input);

	if (match) {
		return match[1];
	}

	return false;
};

export default defineCommand({
	name: 'join',
	minifiedDescription: 'Invite Bot',
	description: 'Ask bot to join your group.',
	usage: '!join `<url>`',
	aliases: ['j'],
	category: 'Helper',
	limit: 7,
	cooldown: 5,
	status: 'enable',
	async run({ from, query, message, sender, isOwner, settings, prefix }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const Lh = useLocale(locale, 'helper');

		if (!query) {
			return await client.reply(from, L.errors.noUrl, message);
		}

		const groups = await client.groupFetchAllParticipating();

		const isGroupMaxed = Object.keys(groups).length > settings.max_group;
		const reg = regex(query);

		if (isGroupMaxed && !isOwner) {
			return await client.reply(from, L.errors.groupMaxed, message);
		}

		if (!reg) {
			return await client.reply(from, L.errors.invalidUrl, message);
		}

		const metadataInvite = await client.groupGetInviteInfo(reg).catch(() => null);

		if (!metadataInvite) {
			return await client.reply(from, L.errors.invalidInvite, message);
		}

		if (Object.keys(groups).includes(metadataInvite.id)) {
			await client.reply(from, Lh.labels.alreadyInGroup, message);
		} else if (!isOwner && metadataInvite.size >= 1024) {
			await client.reply(from, L.errors.groupFull, message);
		} else if (!isOwner && metadataInvite.size < settings.min_members) {
			await client.reply(from, t(locale, 'owner.labels.groupNotBigEnough', [settings.min_members]), message);
		} else if (
			!isOwner &&
			!metadataInvite.participants
				?.filter((v) => v.admin)
				.map((v) => v.id)
				?.includes(sender)
		) {
			await client.reply(from, L.errors.adminOnly, message);
		} else if (metadataInvite) {
			await client.groupAcceptInvite(reg);
			await client.reply(from, Lh.labels.joiningGroup, message);
			await client.send(metadataInvite.id, {
				text: t(locale, 'owner.labels.invitedToGroup', [sender.split('@')[0]]),
				mentions: [sender]
			});
			await client.send(
				from,
				{
					text: L.info.clickToOpenMenu,
					footer: Lh.labels.poweredBy,
					buttons: [{ buttonId: cmdId('menu', '', { prefix }), buttonText: { displayText: Lh.labels.menu }, type: 1 }],
					headerType: 1
				},
				{}
			);
		}
	}
});
