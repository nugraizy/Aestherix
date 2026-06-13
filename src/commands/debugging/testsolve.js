import { BOT_NAME } from '../../core/constants.js';
import { env } from '../../core/env.js';
import { getLocale, useLocale } from '../../helper/i18n/index.js';
import { cfFetchText } from '../../utils/modules/cloudflare.js';
import { ManualSolveError } from '../../utils/modules/manual-solve-error.js';
import { solverManager } from '../../utils/modules/solver-manager.js';
import { defineCommand } from '../_define.js';

const DEMO_URL = 'https://2captcha.com/demo/cloudflare-turnstile-challenge';
const SOLVE_TIMEOUT_MS = 5 * 60 * 1000;

function getDashboardUrl() {
	if (env.DASHBOARD_URL) {
		return env.DASHBOARD_URL.replace(/\/+$/, '');
	}

	const port = env.DASHBOARD_PORT || 4000;

	return `http://localhost:${port}`;
}

export default defineCommand({
	name: 'testsolve',
	description: 'Test the manual Cloudflare Turnstile solving flow.',
	usage: '!testsolve',
	aliases: ['tsolve'],
	category: 'Debugging',
	cooldown: 10,
	limit: 0,
	status: 'enable',
	async run({ from, message }, client) {
		const locale = await getLocale(from);
		const L = useLocale(locale, 'common');
		const wait = await client.waitMessage(from, L.success.fetchingDemo, message);

		try {
			const text = await cfFetchText(DEMO_URL, { service: 'testsolve', timeoutMs: 30_000 });
			const preview = text
				.replace(/<[^>]+>/g, ' ')
				.replace(/\s+/g, ' ')
				.trim()
				.slice(0, 500);

			await wait.update(`${'Test Solve'.formatHeaders()}\n\n${preview.formatForm()}`);
		} catch (error) {
			if (!(error instanceof ManualSolveError)) {
				await wait.update(`Error: ${error.message}`);
				return;
			}

			const dashboardUrl = getDashboardUrl();
			const solveUrl = `${dashboardUrl}/dashboard${error.solveUrl}`;

			const builder = new client.TemplateBuilder.Native();

			builder
				.destination(from)
				.body('A 403 Cloudflare challenge was detected. Solve it manually to continue.')
				.footer(`Powered by ${BOT_NAME}`)
				.buttons(builder.button.url({ display: 'Solve Challenge', url: solveUrl }));

			await builder.send();

			try {
				await solverManager.waitForSolve(error.challengeId, SOLVE_TIMEOUT_MS);

				const retryWait = await client.waitMessage(from, L.success.challengeSolved, message);
				const text = await cfFetchText(DEMO_URL, { service: 'testsolve', timeoutMs: 30_000 });
				const preview = text
					.replace(/<[^>]+>/g, ' ')
					.replace(/\s+/g, ' ')
					.trim()
					.slice(0, 500);

				await retryWait.update(`${'Test Solve'.formatHeaders()}\n\n${preview.formatForm()}`);
			} catch (solveError) {
				await wait.update(`Solve failed: ${solveError.message}`);
			}
		}
	}
});
