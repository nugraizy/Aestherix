import crypto from 'crypto';
import express from 'express';

import configuration from '../helper/config/connect.js';
import { color, fetchJSON, loggers } from '../utils/modules/index.js';

const GITHUB_API = (sha) => `https://api.github.com/repos/nugraizy/Aestherix/commits/${sha}`;
const GITHUB_HEADERS = {
	headers: { Accept: 'application/vnd.github.v3+json', Authorization: `Bearer ${process.env.GITHUB_AUTH_TOKEN}` }
};
const NOTIFICATION_GROUP = '120363027862918129@g.us';

export class WebhookServer {
	#port;
	#secret;
	#server = null;
	#client = null;

	constructor(options = {}) {
		this.#port = options.port || 8080;
		this.#secret = options.secret || process.env.GITHUB_SECRET_WEBHOOK;
	}

	get running() {
		return this.#server !== null;
	}

	/**
	 * Inject the active WhatsApp client. Required before
	 * `handleCommitEvent` and the webhook handler can dispatch.
	 *
	 * @param {object} waClient
	 */
	setClient(waClient) {
		this.#client = waClient;
	}

	start() {
		if (configuration.dashboard.expressInstances.has('github-webhook')) {
			return;
		}

		const app = express();

		app.use(express.json());

		app.get('/hc', (req, res) => res.status(200).send('good condition'));
		app.post('/webhook', (req, res) => this.#handleWebhook(req, res));

		this.#server = app.listen(this.#port, () => {
			loggers.info(color('GitHub Webhook', 'white'), color('started on port', 'lilac'), color(String(this.#port), 'white'));
		});

		configuration.dashboard.expressInstances.set('github-webhook', this.#server);
	}

	stop() {
		if (this.#server) {
			this.#server.close();
			configuration.dashboard.expressInstances.delete('github-webhook');
			this.#server = null;
		}
	}

	async handleCommitEvent(commitInfo) {
		const files = commitInfo.files;
		let filesSummary = '';

		if (files.added.length) {
			filesSummary += files.added.map((v) => `+ ${v}`).join('\n') + '\n';
		}

		if (files.removed.length) {
			filesSummary += files.removed.map((v) => `- ${v}`).join('\n') + '\n';
		}

		if (files.modified.length) {
			filesSummary += files.modified.map((v) => `± ${v}`).join('\n');
		}

		const caption = `${'GitHub Notif'.formatHeaders()}

${commitInfo.message}

Author-by : @${commitInfo.author.name}
Committed At : ${commitInfo.timestamp}

${filesSummary.trim()}

*Showing ${commitInfo.filesChanged} changed files with ${commitInfo.additions} additions and ${commitInfo.deletions} deletions.*`;

		await this.#client?.send(NOTIFICATION_GROUP, { text: caption });
	}

	#handleWebhook(req, res) {
		const signature = req.headers['x-hub-signature'];
		const payload = JSON.stringify(req.body);

		const hmac = crypto.createHmac('sha1', this.#secret);
		const digest = Buffer.from('sha1=' + hmac.update(payload).digest('hex'), 'utf8');
		const checksum = Buffer.from(signature, 'utf8');

		if (checksum.length !== digest.length || !crypto.timingSafeEqual(digest, checksum)) {
			return res.status(401).send('Unauthorized');
		}

		const event = req.headers['x-github-event'];

		if (event !== 'push') {
			return res.status(200).send('OK');
		}

		const commits = req.body.commits;

		commits.forEach(async (commit) => {
			const commitInfo = WebhookServer.#parseCommit(commit);
			const stats = await WebhookServer.#fetchStats(commitInfo.sha);

			this.#client?.ev.emit('commit', { ...commitInfo, ...stats });
		});

		res.status(200).send('OK');
	}

	static #parseCommit(commit) {
		return {
			message: commit.message,
			author: { name: commit.committer.name },
			timestamp: commit.timestamp,
			url: commit.url,
			sha: commit.id,
			files: {
				added: commit.added,
				modified: commit.modified,
				removed: commit.removed
			}
		};
	}

	static async #fetchStats(sha) {
		const data = await fetchJSON(GITHUB_API(sha), GITHUB_HEADERS);

		return {
			filesChanged: data.files.length,
			additions: data.stats.additions,
			deletions: data.stats.deletions
		};
	}
}
