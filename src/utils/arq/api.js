import axios from 'axios';
import dotenv from 'dotenv';
import FormData from 'form-data';

dotenv.config();

class ArqAPI {
	#apiKey = process.env.ARQ_KEY;
	#urlBase = 'https://arq.hamker.dev';
	constructor() {
		this.isNsfw = async (media) => {
			const form = new FormData();

			form.append('file', media);
			return await this.post('/nsfw_scan', form, form.getHeaders());
		};

		this.searchImage = async (query) => {
			return await this.request('/image', {
				params: {
					query,
				},
				method: 'GET',
			});
		};

		this.findLyrics = async (query) => {
			return await this.request('/lyrics', {
				params: {
					query,
				},
				method: 'GET',
			});
		};

		this.searchPHub = async (query) => {
			return await this.request('/ph', {
				params: {
					query,
					thumbsize: 'large_hd',
				},
				method: 'GET',
			});
		};

		this.subreddits = async (query = 'memes') => {
			return await this.request('/reddit', {
				params: {
					query,
				},
			});
		};

		this.searchWallpaperARQ = async (query) => {
			return await this.request('/wall', {
				params: {
					query,
				},
			});
		};
	}
	async request(path, _) {
		try {
			const { data } = await axios({
				url: this.#urlBase + path,
				..._,
				headers: {
					'content-type': 'application/json',
					'X-API-KEY': this.#apiKey,
				},
			});

			return data;
		} catch (err) {
			return err?.response?.data;
		}
	}

	async post(path, form, _) {
		try {
			const { data } = await axios.post(this.#urlBase + path, form, {
				headers: {
					..._,
					'X-API-KEY': this.#apiKey,
				},
			});

			return data;
		} catch (err) {
			return err?.response?.data;
		}
	}
}

export const arq = new ArqAPI();
