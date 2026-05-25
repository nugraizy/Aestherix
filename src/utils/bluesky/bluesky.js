import { AtpAgent } from '@atproto/api';
import axios from 'axios';

import { color, loggers } from '../modules/index.js';
import { extractInfoFromUrl } from './utils.js';

class Bluesky {
	constructor() {
		this.agent = new AtpAgent({
			service: 'https://bsky.social'
		});

		this.isLogin = false;
	}

	async login() {
		if (!this.isLogin) {
			await this.agent
				.login({
					identifier: process.env.BLUESKY_IDENTIFIER,
					password: process.env.BLUESKY_PASSWORD
				})
				.catch((e) => {
					if (e.error === 'AuthenticationRequired') {
						loggers.error(color('Bluesky authentication failed:', 'red'), e);
						return {
							error: 'Correct Authentication are required. Check your identifier and password and try again.'
						};
					}
				});

			this.isLogin = true;
		}
	}

	async getPost(url) {
		await this.login();

		const info = extractInfoFromUrl(url);

		if (!info) {
			return {
				error: 'Failed to extract info from the url.'
			};
		}

		const post = await this.agent
			.getPostThread({
				uri: `at://${info.user}/app.bsky.feed.post/${info.id}`
			})
			.catch((e) => {
				if (e.error === 'AuthMissing') {
					return {
						error: 'Auth are missing. Login are required to use this method.'
					};
				}
			});

		const data = post.data.thread.post;

		if (data.embed.$type === 'app.bsky.embed.images#view') {
			return {
				images: data.embed.images.map((v) => v.fullsize),
				caption: data.record.text || '',
				author: {
					displayName: data.author.displayName,
					username: data.author.handle
				}
			};
		} else if (data.embed.$type === 'app.bsky.embed.video#view') {
			const { cid, did } = { cid: data.embed.cid, did: data.author.did };

			if (did) {
				let url;

				if (did.startsWith('did:web:')) {
					url = 'https://' + did.split(':')[2] + '/.well-known/did.json';
				} else {
					url = 'https://plc.directory/' + did;
				}

				try {
					const {
						data: { service }
					} = await axios.get(url);

					for (const { type, serviceEndpoint } of service) {
						if (type === 'AtprotoPersonalDataServer') {
							url = serviceEndpoint;
							break;
						}

						url = 'https://bsky.social';
					}
				} catch {
					loggers.error(color('Bluesky PDS endpoint fetch failed.', 'red'));
				}

				return {
					videos: [`${url}/xrpc/com.atproto.sync.getBlob?did=${did}&cid=${cid}`],
					caption: data.record.text || '',
					author: {
						displayName: data.author.displayName,
						username: data.author.handle
					}
				};
			}
		}
	}
}

const bluesky = new Bluesky();

export { bluesky };
