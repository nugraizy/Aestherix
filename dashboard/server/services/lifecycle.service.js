import { spawn } from 'node:child_process';

const DEFAULT_BOT_APP = String(process.env.BOT_PM2_APP_NAME || 'aestherix-bot').trim() || 'aestherix-bot';

function currentPm2App() {
	return String(process.env.name || '').trim();
}

function runPm2(action, appName) {
	return new Promise((resolve) => {
		let proc;

		try {
			proc = spawn('pm2', [action, appName], { stdio: 'pipe' });
		} catch (error) {
			resolve({ ok: false, status: 500, message: error?.message || `Failed spawning pm2 ${action}.` });
			return;
		}

		let stderr = '';
		let stdout = '';

		proc.stderr.on('data', (chunk) => {
			stderr += String(chunk);
		});

		proc.stdout.on('data', (chunk) => {
			stdout += String(chunk);
		});

		proc.on('error', (error) => {
			if (error?.code === 'ENOENT') {
				resolve({ ok: false, status: 503, message: 'PM2 is not installed or not on PATH.' });
				return;
			}

			resolve({ ok: false, status: 500, message: error?.message || `pm2 ${action} failed.` });
		});

		proc.on('exit', (code) => {
			if (code === 0) {
				resolve({ ok: true, output: stdout.trim() });
				return;
			}

			const message = stderr.trim() || stdout.trim() || `pm2 ${action} exited with code ${code}.`;

			resolve({ ok: false, status: 500, message });
		});
	});
}

export function createLifecycleService({ botPm2AppName = DEFAULT_BOT_APP } = {}) {
	if (!botPm2AppName) {
		throw new Error('lifecycle.service: botPm2AppName is required');
	}

	function isSelfTarget() {
		const self = currentPm2App();

		return Boolean(self) && self === botPm2AppName;
	}

	async function start() {
		return runPm2('start', botPm2AppName);
	}

	async function stop() {
		if (isSelfTarget()) {
			return {
				ok: false,
				status: 409,
				message:
					'Cannot stop the bot from the same PM2 app — that would kill the dashboard. Run dashboard and bot as separate PM2 apps.'
			};
		}

		return runPm2('stop', botPm2AppName);
	}

	return {
		botPm2AppName,
		isSelfTarget,
		start,
		stop
	};
}
