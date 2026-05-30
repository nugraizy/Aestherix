const defaultCacheExpirationMs = 5 * 60 * 1000;

export class PlayerCache {
	constructor() {
		this.key = '';
		this.expiredAt = 0;
		this.config = null;
	}

	get(key) {
		return this.getCacheBefore(key, Date.now());
	}

	getCacheBefore(key, time) {
		if (key === this.key && this.expiredAt > time) {
			return this.config;
		}

		return null;
	}

	set(key, config) {
		this.setWithExpiredTime(key, config, Date.now() + defaultCacheExpirationMs);
	}

	setWithExpiredTime(key, config, expiredAt) {
		this.key = key;
		this.config = config;
		this.expiredAt = expiredAt;
	}
}
