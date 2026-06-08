import pm2 from 'pm2';

export const IS_PM2 = Boolean(process.env.pm_id);

export function startPm2SubBot(sessionName) {
	return new Promise((resolve, reject) => {
		pm2.start(
			{
				script: './subbot.js',
				name: `aestherix-sub-${sessionName}`,
				args: sessionName,
				autorestart: false,
				env: {
					NODE_ENV: 'production',
					SUB_BOT_PROCESS: '1'
				}
			},
			(err) => {
				if (err) {
					reject(new Error(`PM2 start failed: ${err.message || err}`));
					return;
				}

				resolve();
			}
		);
	});
}

export function stopPm2SubBot(sessionName) {
	return new Promise((resolve) => {
		const name = `aestherix-sub-${sessionName}`;

		pm2.delete(name, () => resolve());
	});
}
