import { TidalApi } from './utils/api.tidal.js';
import { decodeManifestBase64 } from './utils/decode.js';

class HiFi {
	constructor(tidalApi = new TidalApi()) {
		this.tidalApi = tidalApi;
	}

	extractPayload(response) {
		if (!response || typeof response !== 'object') {
			return response;
		}

		return response.data ?? response;
	}

	toFriendlyError(error) {
		if (error?.message?.includes('All servers failed')) {
			return 'Too Many Requests. Try again later.';
		}

		return error?.message || 'Too Many Requests. Try again later.';
	}

	async search(query, type = 'track') {
		if (!query) {
			throw new Error('Query is required');
		}

		try {
			const response =
				type === 'track'
					? await this.tidalApi.getSearch({ s: query, limit: 50 })
					: await this.tidalApi.getSearch({ al: query });

			if (response?.error) {
				return response;
			}

			return this.extractPayload(response);
		} catch (error) {
			return this.toFriendlyError(error);
		}
	}

	async download(id) {
		if (!id) {
			throw new Error('ID is required');
		}

		try {
			const downloadResponse = await this.tidalApi.getTrack({ id, quality: 'LOSSLESS' });
			const downloadDomain = this.tidalApi.domain;
			const infoResponse = await this.tidalApi.getInfo(id);

			if (downloadResponse?.error) {
				return downloadResponse;
			}

			const file = this.extractPayload(downloadResponse);
			const track = this.extractPayload(infoResponse);
			const original = JSON.parse(decodeManifestBase64(file.manifest))?.urls?.[0] || null;

			if (!original) {
				throw new Error('Could not retrieve original track URL');
			}

			return {
				file,
				track,
				url: original,
				cover: track ? this.stringToCover(track.album.cover) : null,
				domain: downloadDomain
			};
		} catch (error) {
			return this.toFriendlyError(error);
		}
	}

	async getAlbum(id) {
		if (!id) {
			throw new Error('ID is required');
		}

		try {
			const response = await this.tidalApi.getAlbum({ id });

			if (response?.error) {
				return response;
			}

			return this.extractPayload(response);
		} catch (error) {
			return this.toFriendlyError(error);
		}
	}

	async getMix(query) {
		if (!query) {
			throw new Error('Query is required');
		}

		try {
			const searchResponse = await this.search(query, 'track');

			if (searchResponse?.error) {
				return searchResponse;
			}

			const mixId = searchResponse?.items?.[0]?.mixes?.TRACK_MIX;

			if (!mixId) {
				throw new Error('Mix not found for query: ' + query);
			}

			const mixResponse = await this.tidalApi.getMix({ id: mixId });

			if (mixResponse?.error) {
				return mixResponse;
			}

			return this.tidalApi.withDomain({ tracks: this.tidalApi.parseMixData(mixResponse.items) });
		} catch (error) {
			return this.toFriendlyError(error);
		}
	}

	stringToCover(id) {
		return `https://resources.tidal.com/images/${id.replace(/-/g, '/')}/1280x1280.jpg`;
	}
}

export const hifi = new HiFi();
