import { fetch } from 'undici';

const domainsUrl = {
	search: (query) => [
		...['kraken', 'shiva', 'triton', 'aether', 'zeus', 'chaos', 'phoenix'].map(
			(subdomain) => `https://${subdomain}.squid.wtf/search/?s=${encodeURIComponent(query)}`
		),
		...['ohio', 'virginia', 'frankfurt', 'singapore', 'tokyo'].map(
			(subdomain) => `https://${subdomain}.monochrome.tf/search/?s=${encodeURIComponent(query)}`
		)
	],
	download: (id) => [
		...['kraken', 'shiva', 'triton', 'aether', 'zeus', 'chaos', 'phoenix'].map(
			(subdomain) => `https://${subdomain}.squid.wtf/track/?id=${encodeURIComponent(id)}&quality=LOSSLESS`
		),
		...['ohio', 'virginia', 'frankfurt', 'singapore', 'tokyo'].map(
			(subdomain) => `https://${subdomain}.monochrome.tf/track/?id=${encodeURIComponent(id)}&quality=LOSSLESS`
		)
	]
};

class Dab {
	constructor() {}

	/**
	 *
	 * @param {import('undici').Response} response
	 * @returns
	 */
	async toJson(response) {
		return response.json();
	}

	async search(query) {
		if (!query) {
			throw new Error('Query is required');
		}

		const domains = domainsUrl.search(query);
		let response = null;

		for (const domain of domains) {
			try {
				const res = await fetch(domain);
				response = await this.toJson(res);

				if (response?.detail === 'Too Many Requests') {
					continue;
				}

				break;
			} catch (err) {
				console.error(`Error fetching from ${domain}:`, err);
				continue;
			}
		}

		if (!response || response?.detail === 'Too Many Requests') {
			return { error: 'Too Many Requests. Try again later.' };
		}

		return response;
	}

	async download(id) {
		if (!id) {
			throw new Error('ID is required');
		}

		const domains = domainsUrl.download(id);
		let response = null;

		for (const domain of domains) {
			try {
				const res = await fetch(domain);
				response = await this.toJson(res);

				if (response?.detail === 'Too Many Requests') {
					continue;
				}

				break;
			} catch (err) {
				console.error(`Error fetching from ${domain}:`, err);
				continue;
			}
		}

		if (!response || response?.detail === 'Too Many Requests') {
			return { error: 'Too Many Requests. Try again later.' };
		}

		const { OriginalTrackUrl } = response.find((val) => val.OriginalTrackUrl);
		const fileDetails = response.find((val) => val.trackId);
		const trackDetails = response.find((val) => val.id && val.title);

		return {
			file: fileDetails,
			track: trackDetails,
			url: OriginalTrackUrl,
			cover: this.stringToCover(trackDetails.album.cover)
		};
	}

	stringToCover(id) {
		return `https://resources.tidal.com/images/${id.replace(/\-/g, '/')}/1280x1280.jpg`;
	}
}

export const dab = new Dab();
