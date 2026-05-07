import crypto from 'crypto';
import express from 'express';

import { color, loggers } from '../../../utils/modules/index.js';
import configuration from '../../config/connect.js';
import { getFilesChanged, parseCommit } from './utils.js';

export const githubWebhook = () => {
	if (configuration.expressInstances.has('github-webhook')) {
		return;
	}

	const app = express();

	app.use(express.json());

	const secret = process.env.GITHUB_SECRET_WEBHOOK;

	app.get('/hc', (req, res) => {
		res.status(200).send('good condition');
	});

	app.post('/webhook', (req, res) => {
		const signature = req.headers['x-hub-signature'];
		const payload = JSON.stringify(req.body);

		const hmac = crypto.createHmac('sha1', secret);
		const digest = Buffer.from('sha1=' + hmac.update(payload).digest('hex'), 'utf8');
		const checksum = Buffer.from(signature, 'utf8');

		if (checksum.length !== digest.length || !crypto.timingSafeEqual(digest, checksum)) {
			return res.status(401).send('Unauthorized');
		}

		const event = req.headers['x-github-event'];
		const commitEvent = 'push';

		if (event === commitEvent) {
			const commits = req.body.commits;

			commits.forEach(async (commit) => {
				const commitInfo = parseCommit(commit);

				const { additions, deletions, filesChanged } = await getFilesChanged(commitInfo.sha);

				client.instance.ev.emit('commit', { ...commitInfo, additions, deletions, filesChanged });

				res.status(200).send('OK');
			});
		}
	});

	const appToStore = app.listen(8080, () => {
		loggers.info(color('GitHub Webhook', 'white'), color('started on port', 'lilac'), color('8080', 'white'));
	});

	configuration.expressInstances.set('github-webhook', appToStore);
};
