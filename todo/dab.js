import { Client } from 'undici';

class Dab {
	constructor() {
		this.client = new Client('https://dab.yeet.su/api/');
	}

	async _request(endpoint, options = {}) {
		const response = await this.client.request({ method: 'GET', path: endpoint, ...options });

		if (response.statusCode < 200 || response.statusCode >= 300) {
			throw new Error(`Request failed with status code ${response.statusCode}`);
		}

		return response.body.json();
	}

	async search(query, type) {
		if (!query) {
			throw new Error('Query is required');
		}

		if (!type || !['track', 'album'].includes(type)) {
			throw new Error('Type must be either "track" or "album"');
		}

		return this._request(`/search?q=${encodeURIComponent(query)}&type=${type}`);
	}

	async download(id) {
		if (!id) {
			throw new Error('ID is required');
		}

		const {} = await this._request(`/stream?trackId=${id}&quality=24`);
	}
}
