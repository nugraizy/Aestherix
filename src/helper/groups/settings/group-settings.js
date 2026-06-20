import prisma from '../../database/prisma.js';

export async function getAutomodRules(groupId, sessionName = 'main') {
	const row = await prisma.settingsManager.findUnique({
		where: { groupId_sessionName: { groupId, sessionName } }
	});

	if (!row) {
		return [];
	}

	try {
		return JSON.parse(row.automodRules || '[]');
	} catch {
		return [];
	}
}

export async function setAutomodRules(groupId, rules, sessionName = 'main') {
	await prisma.settingsManager.upsert({
		where: { groupId_sessionName: { groupId, sessionName } },
		create: { groupId, sessionName, automodRules: JSON.stringify(rules) },
		update: { automodRules: JSON.stringify(rules) }
	});
}

export async function getCustomAliases(groupId, sessionName = 'main') {
	const row = await prisma.settingsManager.findUnique({
		where: { groupId_sessionName: { groupId, sessionName } }
	});

	if (!row) {
		return {};
	}

	try {
		return JSON.parse(row.customAliases || '{}');
	} catch {
		return {};
	}
}

export async function setCustomAliases(groupId, aliases, sessionName = 'main') {
	await prisma.settingsManager.upsert({
		where: { groupId_sessionName: { groupId, sessionName } },
		create: { groupId, sessionName, customAliases: JSON.stringify(aliases) },
		update: { customAliases: JSON.stringify(aliases) }
	});
}
