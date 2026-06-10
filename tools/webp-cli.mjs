import { execSync, spawn } from 'node:child_process';
import { Readable } from 'node:stream';
import fs from 'fs-extra';
import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';

const input = process.argv[2];

if (!input) {
	console.log('Usage: node tools/webp-cli.mjs <input-file-or-url>');
	console.log('\nRequires: cwebp, webpmux (apt install webp)');
	process.exit(1);
}

const DEBUG_DIR = './tmp';

await fs.ensureDir(DEBUG_DIR);

console.log(`\n--- Input: ${input} ---\n`);

let media;

if (input.startsWith('http://') || input.startsWith('https://')) {
	console.log('[1] Fetching URL...');

	const res = await fetch(input);

	console.log(`    Status: ${res.status} ${res.statusText}`);
	console.log(`    Content-Type: ${res.headers.get('content-type')}`);
	media = Buffer.from(await res.arrayBuffer());
} else {
	media = await fs.readFile(input);
}

console.log(`    Buffer: ${media.length} bytes`);
console.log(`    First 16 bytes: ${media.subarray(0, 16).toString('hex')}`);

const type = await fileTypeFromBuffer(media);

console.log(`    Detected type: ${type?.mime || 'unknown'}`);

const isVideo = type?.mime?.includes('video');
const isImage = type?.mime?.startsWith('image/');
const ts = Date.now();
const tmpInput = `${DEBUG_DIR}/${ts}-tmp-input.${type?.ext || 'bin'}`;
const tmpWebp = `${DEBUG_DIR}/${ts}-tmp.webp`;
const tmpExif = `${DEBUG_DIR}/${ts}-tmp-exif.webp`;
const outputFinal = `${DEBUG_DIR}/${ts}-output.webp`;

await fs.writeFile(tmpInput, media);

console.log(`\n[2] Converting to WebP (${isVideo ? 'ffmpeg' : 'cwebp'})...\n`);

if (isVideo) {
	await new Promise((resolve, reject) => {
		const args = [
			'-i', tmpInput,
			'-vcodec', 'libwebp',
			'-fs', '800k',
			'-r', '15',
			'-b:v', '500k',
			'-vf', 'scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,setsar=1',
			'-t', '10',
			'-f', 'webp',
			'-y',
			tmpWebp
		];
		const ff = spawn('ffmpeg', args, { windowsHide: true });
		const stderrChunks = [];

		ff.stderr.on('data', (chunk) => stderrChunks.push(chunk));
		ff.on('error', reject);
		ff.on('close', (code) => {
			console.log(`    ffmpeg exit code: ${code}`);

			if (code !== 0) {
				console.log(`    stderr: ${Buffer.concat(stderrChunks).toString().slice(0, 500)}`);
				reject(new Error(`ffmpeg exited with code ${code}`));
				return;
			}

			resolve();
		});
	});
} else if (isImage) {
	try {
		execSync(`cwebp -q 80 -resize 512 512 "${tmpInput}" -o "${tmpWebp}"`, { stdio: 'pipe' });
		console.log('    cwebp OK');
	} catch (err) {
		console.log(`    cwebp failed: ${err.stderr?.toString().slice(0, 500)}`);
		console.log('    Falling back to sharp...');

		const buf = await sharp(media)
			.resize(512, 512, { fit: sharp.fit.contain, background: { r: 0, g: 0, b: 0, alpha: 0 } })
			.webp()
			.toBuffer();

		await fs.writeFile(tmpWebp, buf);
	}
} else {
	console.log('    Unknown type, trying sharp...');

	const buf = await sharp(media)
		.resize(512, 512, { fit: sharp.fit.contain, background: { r: 0, g: 0, b: 0, alpha: 0 } })
		.webp()
		.toBuffer();

	await fs.writeFile(tmpWebp, buf);
}

const webpBuf = await fs.readFile(tmpWebp);

console.log(`    WebP file: ${tmpWebp} (${webpBuf.length} bytes)`);
console.log(`    First 16 bytes: ${webpBuf.subarray(0, 16).toString('hex')}`);

const isRIFF = webpBuf.subarray(0, 4).toString() === 'RIFF';
const isWEBP = webpBuf.subarray(8, 12).toString() === 'WEBP';

console.log(`    RIFF: ${isRIFF}  WEBP: ${isWEBP}`);

if (!isRIFF || !isWEBP) {
	console.log('\n[FAIL] Output is NOT valid WebP!');

	await fs.remove(tmpInput);
	await fs.remove(tmpWebp);
	process.exit(1);
}

console.log('\n[3] Checking webpmux availability...\n');

let hasWebpmux = true;

try {
	execSync('webpmux -version', { stdio: 'pipe' });
	console.log('    webpmux found');
} catch {
	hasWebpmux = false;
	console.log('    webpmux not found (apt install webp)');
}

if (hasWebpmux) {
	console.log('\n[4] Injecting EXIF via webpmux...\n');

	const exifJson = JSON.stringify({
		'sticker-pack-id': 'test-id',
		'sticker-pack-name': 'Test Pack',
		'sticker-pack-publisher': 'Test'
	});
	const exifFile = `${DEBUG_DIR}/${ts}-exif.json`;

	await fs.writeFile(exifFile, exifJson);

	try {
		execSync(`webpmux -set exif "${exifFile}" "${tmpWebp}" -o "${tmpExif}"`, { stdio: 'pipe' });
		console.log('    webpmux OK');

		const finalBuf = await fs.readFile(tmpExif);

		await fs.writeFile(outputFinal, finalBuf);
		console.log(`    Final output: ${outputFinal} (${finalBuf.length} bytes)`);
		console.log('\n[OK] Success!');
	} catch (err) {
		console.log(`    webpmux failed: ${err.stderr?.toString().slice(0, 500)}`);
		console.log('\n[FAIL] EXIF injection failed');
	}
} else {
	console.log('\n[4] Injecting EXIF via node-webpmux (fallback)...\n');

	try {
		const WebPMux = await import('node-webpmux');
		const img = new WebPMux.Image();

		await img.load(webpBuf);
		console.log('    img.load() OK');

		const data = { 'sticker-pack-id': 'test-id', 'sticker-pack-name': 'Test Pack', 'sticker-pack-publisher': 'Test' };
		const jsonBuf = Buffer.from(JSON.stringify(data), 'utf-8');
		const exif = Buffer.concat([
			Buffer.from([0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57, 0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00]),
			jsonBuf
		]);

		exif.writeUIntLE(new TextEncoder().encode(JSON.stringify(data)).length, 14, 4);
		img.exif = exif;

		const output = await img.save(null);

		await fs.writeFile(outputFinal, output);
		console.log(`    Final output: ${outputFinal} (${output.length} bytes)`);
		console.log('\n[OK] Success via node-webpmux!');
	} catch (err) {
		console.log(`    node-webpmux error: ${err.message}`);
		console.log('\n[FAIL] Install webp: apt install webp');
	}
}

await fs.remove(tmpInput);
await fs.remove(tmpExif);

console.log(`\n--- Kept: ${tmpWebp}, ${outputFinal} ---`);
