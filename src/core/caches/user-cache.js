import { Cache } from '../../helper/modules/cache.js';

export class UserCache {
	#info = new Cache();
	#afk = new Cache();
	#cooldowns = new Cache();

	get info() {
		return this.#info;
	}

	get afk() {
		return this.#afk;
	}

	getInfo(jid) {
		return this.#info.get(jid);
	}

	setInfo(jid, data) {
		this.#info.set(jid, data);
	}

	hasInfo(jid) {
		return this.#info.has(jid);
	}

	setAfk(jid, groupId, data) {
		const key = groupId ? `${jid}:${groupId}` : jid;

		this.#afk.set(key, data);
	}

	getAfk(jid, groupId) {
		const key = groupId ? `${jid}:${groupId}` : jid;

		return this.#afk.get(key);
	}

	checkAfk(jid, groupId) {
		const key = groupId ? `${jid}:${groupId}` : jid;

		return this.#afk.has(key);
	}

	deleteAfk(jid, groupId) {
		const key = groupId ? `${jid}:${groupId}` : jid;

		this.#afk.delete(key);
	}

	checkCooldown(senderId, commandName, cooldownSec) {
		const key = `${senderId}:${commandName}`;
		const now = Date.now();
		const expiry = this.#cooldowns.get(key);

		if (expiry && now < expiry) {
			return { onCooldown: true, remaining: Math.ceil((expiry - now) / 1000) };
		}

		this.#cooldowns.set(key, now + cooldownSec * 1000);

		return { onCooldown: false, remaining: 0 };
	}

	clear() {
		this.#info.clear();
		this.#afk.clear();
		this.#cooldowns.clear();
	}
}
