import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

export class Github {
	#access = process.env.GITHUB_ACCESS;
	#personal = process.env.GITHUB_AUTH_TOKEN;
	#urlBase = 'https://api.github.com';
	constructor() {
		this.searchUser = (user) =>
			new Promise(async (resolve, reject) => {
				try {
					const res = await this.req('/search/users', { q: user, /* eslint-disable-line */ per_page: 100 }, 'GET', true);

					resolve(res);
				} catch (err) {
					// TODO: handle rate-limited error.
					reject(err);
				}
			});

		this.searchRepository = (repo) =>
			new Promise(async (resolve, reject) => {
				try {
					const res = await this.req(
						'/search/repositories',
						{ q: encodeURI(repo), /* eslint-disable-line */ per_page: 100 },
						'GET',
						true,
					);

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
						{ q: `${encodeURI(keyword)}+user:adiwajshing`, /* eslint-disable-line */ per_page: 100 },
						'GET',
						true,
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
					const res = await this.req('/search/code', { q: code, /* eslint-disable-line */ per_page: 100 }, 'GET');

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
		const { data } = await axios({
			url: this.#urlBase + path,
			params,
			method,
			headers: {
				Authorization: `Token ${access ? this.#access : this.#personal}`,
				Accept: 'application/vnd.github.text-match+json',
			},
		});

		return data;
	}

	async extractMetadata(input) {
		if (Array.isArray(input)) {
			return (
				await Promise.all(
					input.map((v) =>
						axios({
							url: `${this.#urlBase}/users/${v.login}`,
							Authorization: `Token ${this.#access}`,
							method: 'GET',
						}),
					),
				)
			).map(({ data }) => data);
		}

		const { data } = await axios({
			url: `${this.#urlBase}/users/${input}`,
			Authorization: `Token ${this.#access}`,
			method: 'GET',
		});

		return data;
	}
}
