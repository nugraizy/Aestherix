import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		svelte(),
		{
			name: 'dashboard-redirect',
			apply: 'serve',
			enforce: 'pre',
			configureServer(server) {
				server.middlewares.use((req, res, next) => {
					const path = (req.url || '').split('?')[0];

					if (path === '/dashboard') {
						res.statusCode = 302;
						res.setHeader('Location', '/dashboard/');
						res.end();
						return;
					}

					next();
				});
			}
		}
	],
	base: '/dashboard/',
	build: {
		outDir: './dist',
		emptyOutDir: true,
		chunkSizeWarningLimit: 800
	},
	server: {
		host: true,
		port: 5173,
		strictPort: true,
		proxy: {
			'/api': {
				target: 'http://localhost:4000',
				changeOrigin: true
			},
			'/status': {
				target: 'http://localhost:4000',
				changeOrigin: true
			},
			'/socket.io': {
				target: 'http://localhost:4000',
				ws: true,
				changeOrigin: true
			}
		}
	}
});
