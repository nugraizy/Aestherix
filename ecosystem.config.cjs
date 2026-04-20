module.exports = {
	apps: [
		{
			name: 'aestherix-bot',
			script: './index.js',
			args: 'nugraizy_android -z -w -c',
			env: {
				NODE_ENV: 'production',
				DASHBOARD_EMBEDDED: '0',
				DASHBOARD_BRIDGE_PORT: '4010',
				DASHBOARD_BRIDGE_TOKEN: 'aestherix-local-bridge-token'
			}
		},
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
