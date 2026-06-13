import { registerNamespace } from '../helper/i18n/index.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const entries = fs.readdirSync(__dirname, { withFileTypes: true });

for (const entry of entries) {
	if (!entry.isDirectory() || entry.name === 'node_modules') {
		continue;
	}

	const nsDir = path.join(__dirname, entry.name);
	const files = fs.readdirSync(nsDir).filter((f) => f.endsWith('.js') && f !== 'index.js');

	for (const file of files) {
		const locale = path.basename(file, '.js');
		const filePath = pathToFileURL(path.join(nsDir, file)).href;
		const mod = await import(filePath);

		registerNamespace(entry.name, locale, mod.default);
	}
}
