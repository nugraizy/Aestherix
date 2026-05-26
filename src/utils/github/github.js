import { fetchJSON } from '../modules/index.js';

export class Github {
	#access = process.env.GITHUB_ACCESS;
	#personal = process.env.GITHUB_AUTH_TOKEN;
	#urlBase = 'https://api.github.com';
	constructor() {
		this.searchUser = (user) =>
			new Promise(async (resolve, reject) => {
				try {
					const res = await this.req('/search/users', { q: user, per_page: 100 }, 'GET', true);

					resolve(res);
				} catch (err) {
					// TODO: handle rate-limited error.
					reject(err);
				}
			});

		this.searchRepository = (repo) =>
			new Promise(async (resolve, reject) => {
				try {
					const res = await this.req('/search/repositories', { q: encodeURI(repo), per_page: 100 }, 'GET', true);

					resolve(res);
				} catch (err) {
					// TODO: handle rate-limited error.
					reject(err);
				}
			});

		this.searchBaileysIssue = (keyword) =>
			new Promise(async (resolve, reject) => {
				try {
					const res = await this.req(
						'/search/issues',
						{ q: `${encodeURI(keyword)}+user:adiwajshing`, per_page: 100 },
						'GET',
						true
					);

					resolve(res);
				} catch (err) {
					// TODO: handle rate-limited error.
					reject(err);
				}
			});

		this.searchCode = (code) =>
			new Promise(async (resolve, reject) => {
				try {
					const res = await this.req('/search/code', { q: code, per_page: 100 }, 'GET');

					resolve(res);
				} catch (err) {
					// TODO: handle rate-limited error.
					reject(err);
				}
			});

		this.detailUser = (input) =>
			new Promise(async (resolve, reject) => {
				try {
					const res = await this.extractMetadata(input);

					resolve(res);
				} catch (err) {
					// TODO: handle rate-limited error.
					reject(err);
				}
			});
	}

	async req(path, params, method, access = false) {
		const url = new URL(this.#urlBase + path);

		Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

		const data = await fetchJSON(url.toString(), {
			method,
			headers: {
				Authorization: `Token ${access ? this.#access : this.#personal}`,
				Accept: 'application/vnd.github.text-match+json'
			}
		});

		return data;
	}

	async extractMetadata(input) {
		if (Array.isArray(input)) {
			return Promise.all(
				input.map((v) =>
					fetchJSON(`${this.#urlBase}/users/${v.login}`, {
						headers: { Authorization: `Token ${this.#access}` }
					})
				)
			);
		}

		return fetchJSON(`${this.#urlBase}/users/${input}`, {
			headers: { Authorization: `Token ${this.#access}` }
		});
	}
}
