const isWindows = process.platform === 'win32';
let needsXvfb = false;

if (!isWindows) {
	try {
		const gl = require('gl');
		const ctx = gl(1, 1);

		if (!ctx) {
			needsXvfb = true;
		} else {
			ctx.getExtension('STACKGL_destroy_context')?.destroy();
		}
	} catch {
		needsXvfb = true;
	}
}

const botApp = needsXvfb
	? {
			name: 'aestherix-bot',
			script: './scripts/xvfb-run.sh',
			interpreter: 'bash',
			env: {
				LIBGL_ALWAYS_SOFTWARE: '1',
				MESA_LOADER_DRIVER_OVERRIDE: 'llvmpipe',
				NODE_ENV: 'production',
				DASHBOARD_EMBEDDED: '0',
				DASHBOARD_BRIDGE_PORT: '4010',
				DASHBOARD_BRIDGE_TOKEN: 'aestherix-local-bridge-token'
			}
		}
	: {
			name: 'aestherix-bot',
			script: './index.js',
			args: 'aestherix --watch --pair-mode --limit-reset --multi-cmd --cool-down --no-sub --pipe',
			env: {
				NODE_ENV: 'production',
				DASHBOARD_EMBEDDED: '0',
				DASHBOARD_BRIDGE_PORT: '4010',
				DASHBOARD_BRIDGE_TOKEN: 'aestherix-local-bridge-token'
			}
		};

module.exports = {
	apps: [
		botApp,
		{
			name: 'aestherix-dashboard',
			script: './dashboard.js',
			env: {
				NODE_ENV: 'production',
				DASHBOARD_PORT: '4000',
				DASHBOARD_BOT_BRIDGE_URL: 'http://127.0.0.1:4010',
				DASHBOARD_BRIDGE_TOKEN: 'aestherix-local-bridge-token'
			}
		}
	]
};
