export const NO_DATA = 'No Data';
export const ZERO = '0@s.whatsapp.net';
export const S_WHATSAPP_NET = '@s.whatsapp.net';

/**
 * @typedef {keyof UPDATE} UpdateType
 */
export const UPDATE = {
	ADD: 'groupParticipantsUpdate',
	REMOVE: 'groupParticipantsUpdate',
	DEMOTE: 'groupParticipantsUpdate',
	PROMOTE: 'groupParticipantsUpdate',
	SUBJECT: 'groupUpdateSubject',
	DESCRIPTION: 'groupUpdateDescription',
	ANNOUNCEMENT: 'groupSettingUpdate',
	NOT_ANNOUNCEMENT: 'groupSettingUpdate',
	UNLOCKED: 'groupSettingUpdate',
	LOCKED: 'groupSettingUpdate',
	RETRIEVE: 'groupInviteCode',
	REVOKE: 'groupRevokeInvite'
};
