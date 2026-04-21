import fs from 'fs/promises';
import path from 'path';
import { minify } from 'uglify-js';

const ROOT = process.cwd();
const DASHBOARD_DIR = path.join(ROOT, 'public', 'dashboard');
const BUILD_DIR = path.join(DASHBOARD_DIR, 'build');
const JS_EXT = '.js';

const walk = async (dirPath) => {
	const entries = await fs.readdir(dirPath, { withFileTypes: true });
	const files = await Promise.all(
		entries.map(async (entry) => {
			const fullPath = path.join(dirPath, entry.name);

			if (entry.isDirectory()) {
				if (fullPath === BUILD_DIR) {
					return [];
				}

				return walk(fullPath);
			}

			if (!entry.isFile()) {
				return [];
			}

			if (!entry.name.endsWith(JS_EXT) || entry.name.endsWith('.min.js')) {
				return [];
			}

			return [fullPath];
		})
	);

	return files.flat();
};

const getOutputPath = (filePath) => {
	const relativePath = path.relative(DASHBOARD_DIR, filePath);

	return path.join(BUILD_DIR, relativePath);
};

const minifyFile = async (filePath) => {
	const sourceCode = await fs.readFile(filePath, 'utf8');
	const isModule = !/\(function\s*\(|module\.exports|require\(/.test(sourceCode);
	const result = minify(
		{ [filePath]: sourceCode },
		{
			compress: true,
			mangle: true,
			module: isModule,
			output: {
				comments: false
			}
		}
	);

	if (result.error) {
		throw result.error;
	}

	const outputPath = getOutputPath(filePath);

	await fs.mkdir(path.dirname(outputPath), { recursive: true });
	await fs.writeFile(outputPath, `${result.code}\n`, 'utf8');

	return outputPath;
};

const run = async () => {
	await fs.rm(BUILD_DIR, { recursive: true, force: true });
	await fs.mkdir(BUILD_DIR, { recursive: true });

	const files = await walk(DASHBOARD_DIR);

	if (!files.length) {
		console.log('No dashboard JavaScript files found to minify.');
		return;
	}

	for (const filePath of files) {
		const outputPath = await minifyFile(filePath);
		
        console.log(`Minified: ${path.relative(ROOT, filePath)} -> ${path.relative(ROOT, outputPath)}`);
	}

	console.log(`Done. Minified ${files.length} file(s) into ${path.relative(ROOT, BUILD_DIR)}.`);
};

run().catch((error) => {
	console.error('Minify build failed:', error);
	process.exitCode = 1;
});
