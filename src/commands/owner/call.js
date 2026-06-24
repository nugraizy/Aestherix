import configuration from '../../helper/config/connect.js';
import { getLocale, t, useLocale } from '../../helper/i18n/index.js';
import { defineCommand } from '../_define.js';
import { getPrefix } from '../../helper/modules/prefix.js';

const attachCallEvents = (call, from, client, locale) => {
	call.on('ringing', () => {
		client.reply(from, t(locale, 'common.voip.info.ringing'), null).catch(() => {});
	});

	call.on('connected', () => {
		client.reply(from, t(locale, 'common.voip.info.connected'), null).catch(() => {});
	});

	call.on('ended', (reason) => {
		client.reply(from, t(locale, 'common.voip.info.ended', [reason]), null).catch(() => {});
	});

	call.on('error', (err) => {
		client.reply(from, t(locale, 'common.voip.errors.callFailed', [err?.message || err]), null).catch(() => {});
	});
};

export default defineCommand({
	name: 'call',
	minifiedDescription: 'Place a voice call or control active call audio',
	description: 'Place a WhatsApp voice call using the WASM VoIP stack, or control active call audio.',
	usage: '`!call` [pause|resume|audio <source|remove>|number] [audioSource]',
	category: 'Owner',
	aliases: ['voip'],
	cooldown: 10,
	limit: 0,
	status: 'disable',
	async run({ from, args, isGroup, sender, participantsGroup, groupName, groupId }, client) {
		const locale = await getLocale(from);
		const prefix = getPrefix();
		const L = useLocale(locale, 'common', { prefix });

		const voip = configuration.voip;

		if (!voip) {
			if (!configuration.flags.enableVoip) {
				return await client.reply(from, L.owner.errors.voipDisabled, null);
			}

			return await client.reply(from, L.owner.errors.voipNotAvailable, null);
		}

		const action = args[1]?.toLowerCase();

		if (action === 'pause') {
			if (!voip.activeCall) {
				return await client.reply(from, L.voip.errors.noActiveCall, null);
			}

			voip.activeCall.pauseAudio();

			return await client.reply(from, L.voip.success.audioPaused, null);
		}

		if (action === 'resume') {
			if (!voip.activeCall) {
				return await client.reply(from, L.voip.errors.noActiveCall, null);
			}

			voip.activeCall.resumeAudio();

			return await client.reply(from, L.voip.success.audioResumed, null);
		}

		if (action === 'audio') {
			if (!voip.activeCall) {
				return await client.reply(from, L.voip.errors.noActiveCall, null);
			}

			const sub = args[2]?.toLowerCase();

			if (sub === 'remove' || sub === 'delete') {
				voip.activeCall.removeAudio();

				return await client.reply(from, L.voip.success.audioRemoved, null);
			}

			const source = args[2];

			if (!source) {
				return await client.reply(from, L.voip.errors.invalidArgs, null);
			}

			voip.activeCall.setAudioSource(source);

			return await client.reply(from, t(locale, 'common.voip.success.audioChanged', [source]), null);
		}

		if (action && !/^\d+$/.test(action)) {
			return await client.reply(from, L.voip.errors.invalidAction, null);
		}

		const phoneNumber = args[1]?.replace(/\D/g, '');

		if (isGroup && !phoneNumber) {
			const botPn = (client.user?.id ?? '').split(':')[0].split('@')[0];
			const botLid = (client.user?.lid ?? '').split(':')[0].split('@')[0];
			const participants = (participantsGroup ?? []).filter((jid) => {
				const num = jid.split(':')[0].split('@')[0];

				return num !== botPn && num !== botLid;
			});

			if (!participants.length) {
				return await client.reply(from, L.voip.errors.noParticipants, null);
			}

			try {
				await client.reply(from, t(locale, 'common.voip.success.groupCalling', [participants.length]), null);

				const call = await voip.groupCall(participants, {
					groupJid: groupId,
					chatName: groupName
				});

				attachCallEvents(call, from, client, locale);

				const ended = await call.waitForEnd();

				await client.reply(from, t(locale, 'common.voip.success.groupFinished', [ended]), null);
			} catch (err) {
				await client.reply(from, t(locale, 'common.voip.errors.groupFailed', [err.message]), null);
			}

			return;
		}

		if (phoneNumber) {
			if (phoneNumber.length < 8) {
				return await client.reply(from, L.voip.errors.invalidNumber, null);
			}

			const audioSource = args[2] || 'silence';

			try {
				await client.reply(from, t(locale, 'common.voip.success.calling', [phoneNumber]), null);

				const call = await voip.call(phoneNumber, { audioSource });

				attachCallEvents(call, from, client, locale);

				const ended = await call.waitForEnd();

				await client.reply(from, t(locale, 'common.voip.success.callFinished', [ended]), null);
			} catch (err) {
				await client.reply(from, t(locale, 'common.voip.errors.callFailed', [err.message]), null);
			}

			return;
		}

		const targetNumber = sender?.replace(/\D/g, '').split(':')[0] ?? '';

		if (!targetNumber || targetNumber.length < 8) {
			return await client.reply(from, L.voip.errors.couldNotResolve, null);
		}

	try {
		await client.reply(from, t(locale, 'common.voip.success.calling', [targetNumber]), null);

		const call = await voip.call(targetNumber);

		attachCallEvents(call, from, client, locale);

		const ended = await call.waitForEnd();

		await client.reply(from, t(locale, 'common.voip.success.callFinished', [ended]), null);
	} catch (err) {
		await client.reply(from, t(locale, 'common.voip.errors.callFailed', [err.message]), null);
	}
	}
});
