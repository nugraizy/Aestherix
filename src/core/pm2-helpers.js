import pm2 from 'pm2';

export const IS_PM2 = Boolean(process.env.pm_id);

function pm2Connect() {
	return new Promise((resolve, reject) => {
		pm2.connect((err) => {
			if (err) {
				reject(new Error(`PM2 connect failed: ${err.message || err}`));
				return;
			}

			resolve();
		});
	});
}

function pm2List() {
	return new Promise((resolve, reject) => {
		pm2.list((err, list) => {
			if (err) {
				reject(err);
				return;
			}

			resolve(list);
		});
	});
}

function pm2Delete(name) {
	return new Promise((resolve) => {
		pm2.delete(name, () => resolve());
	});
}

function pm2Start(options) {
	return new Promise((resolve, reject) => {
		pm2.start(options, (err) => {
			if (err) {
				reject(new Error(`PM2 start failed: ${err.message || err}`));
				return;
			}

			resolve();
		});
	});
}

export async function startPm2SubBot(sessionName) {
	const name = `aestherix-sub-${sessionName}`;

	await pm2Connect();

	const list = await pm2List();
	const existing = list.find((p) => p.name === name);

	if (existing) {
		await pm2Delete(name);
	}

	await pm2Start({
		script: './subbot.js',
		name,
		args: sessionName,
		autorestart: false,
		env: {
			NODE_ENV: 'production',
			SUB_BOT_PROCESS: '1'
		}
	});
}

export async function stopPm2SubBot(sessionName) {
	const name = `aestherix-sub-${sessionName}`;

	await pm2Connect();
	await pm2Delete(name);
}

export async function sendToPm2SubBots(message) {
	await pm2Connect();

	const list = await pm2List();
	const subBots = list.filter((p) => p.name?.startsWith('aestherix-sub-'));

	for (const bot of subBots) {
		try {
			await new Promise((resolve, reject) => {
				pm2.sendDataToProcessId(bot.pm_id, message, (err) => {
					if (err) {
						reject(err);
						return;
					}

					resolve();
				});
			});
		} catch {
			// Sub-bot may have disconnected; ignore
		}
	}
}
