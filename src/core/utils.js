import isOnline from 'is-online';

import { getAllContacts, upsertContacts } from '../helper/database/adapters/user.js';
import prisma from '../helper/database/prisma.js';

let contactsDbCache = null;

async function getContactsCache() {
	if (!contactsDbCache) {
		contactsDbCache = await getAllContacts(prisma).catch(() => []);
	}

	return contactsDbCache;
}

export async function initContact(store, contactsList) {
	const storedContacts = await getContactsCache();

	if (!contactsList.length) {
		for (const { id, name } of storedContacts) {
			store.localContacts[id] = { name, id };
		}
	}

	if (contactsList.length) {
		const toUpsert = contactsList.map(({ id, name }) => ({ jid: id, name: name || 'Unknown' }));

		await upsertContacts(prisma, toUpsert).catch(() => {});
		contactsDbCache = null;

		for (const { id, name } of contactsList) {
			store.localContacts[id] = { name, id };
		}
	}
}

export async function updateContact(store, contactsList) {
	const { localContacts } = store;
	const contactsValue = Object.keys(localContacts);
	const toUpsert = [];

	for (const { id, notify, verifiedName, name } of contactsList) {
		const resolvedName = name || notify || verifiedName || 'Unknown';

		if (contactsValue.includes(id)) {
			localContacts[id].name = resolvedName;
		} else {
			localContacts[id] = { name: resolvedName, id };
		}

		toUpsert.push({ jid: id, name: resolvedName });
	}

	if (toUpsert.length) {
		await upsertContacts(prisma, toUpsert).catch(() => {});
		contactsDbCache = null;
	}
}

export async function checkNetwork() {
	return isOnline();
}

export async function patchMessage(message) {
	const {
		default: { proto: Proto }
	} = await import('baileys');
	const proto = Proto;

	if (message?.deviceSentMessage?.message?.listMessage) {
		message = JSON.parse(JSON.stringify(message));
		message.deviceSentMessage.message.listMessage.listType = proto.Message.ListMessage.ListType.SINGLE_SELECT;
	}

	if (message?.listMessage) {
		message = JSON.parse(JSON.stringify(message));
		message.listMessage.listType = proto.Message.ListMessage.ListType.SINGLE_SELECT;
	}

	if (message?.buttonsMessage) {
		return {
			viewOnceMessage: {
				message: {
					messageContextInfo: { deviceListMetadataVersion: 2, deviceListMetadata: {} },
					...message
				}
			}
		};
	}

	return message;
}

const originalWrite = process.stdout.write.bind(process.stdout);

process.stdout.write = (chunk, encoding, callback) => {
	const text = chunk.toString();

	if (text.includes('Removing old closed session') || text.includes('Closing session') || text.includes('Opening session')) {
		return true;
	}

	return originalWrite(chunk, encoding, callback);
};
