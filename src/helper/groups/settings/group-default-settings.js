import {
	getGroupSettings,
	pushDefaultSettings as pushDefaultSettingsDb,
	updateGroupSetting
} from '../../database/adapters/group-settings.js';
import prisma from '../../database/prisma.js';

const toCacheEntry = (groupId, settings) => {
	if (!settings) {
		return false;
	}

	const { groupId: _id, ...rest } = settings;

	return rest;
};

export const checkJSON = async (from) => {
	const settings = await getGroupSettings(prisma, from);

	return toCacheEntry(from, settings);
};

export const pushDefaultSettings = async (from, groupName, groupDescription) => {
	const settings = await pushDefaultSettingsDb(prisma, from, groupName, groupDescription);

	return toCacheEntry(from, settings);
};

export const updateSettings = async (setting, value, from) => {
	const settings = await updateGroupSetting(prisma, from, setting, value);

	return toCacheEntry(from, settings);
};
