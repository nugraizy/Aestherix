import { spawn } from 'child_process';
import express from 'express';
import validate from 'express-zod-safe';
import path from 'path';
import puppeteer from 'puppeteer';
import { z } from 'zod';

import { color, loggers } from '../../../utils/modules/index.js';

const query = {
	colors: z.string().optional(),
	dimensions: z
		.string()
		.regex(/^\d+x\d+$/)
		.optional(),
	animate: z
		.string()
		.transform((v) => v === 'true')
		.optional(),
	time: z
		.string()
		.transform((v) => parseInt(v, 10))
		.optional(),
	seed: z
		.string()
		.transform((v) => parseInt(v, 10))
		.optional()
};

export const server = (isReconnect) => {
	if (isReconnect) {
		return;
	}

	const app = express();
	const PORT = 4000;

	app.use(express.static(path.join(__dirname, 'public')));

	const parseQuery = (query) => {
		const { colors, dimensions, animate, seed, time } = query;

		const SEED = seed !== 'undefined' ? Number(seed) : Math.floor(Math.random() * 10_000);
		const [WIDTH, HEIGHT] = (dimensions || '1280x720').split('x').map(Number);
		const COLORS = (colors || '295C96,D0CBC7,899FB6').split(',').map((c) => `#${c}`);
		const SHOULD_ANIMATE = animate === true;
		const TIME = time ? Number(time) : 2;

		return { SEED, WIDTH, HEIGHT, COLORS, SHOULD_ANIMATE, TIME };
	};

	app.get('/render', validate({ query }), (req, res) => {
		const { SEED, WIDTH, HEIGHT, COLORS, SHOULD_ANIMATE, TIME } = parseQuery(req.query);

		const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Mesh Gradient</title>
  <script src="http://localhost:${PORT}/build/CCapture.all.min.js"></script>
  <style>
    body, html { margin: 0; padding: 0; overflow: hidden; background: black; }
    canvas { display: block; }
  </style>
</head>
<body>
  <canvas id="canvas" width="${WIDTH}" height="${HEIGHT}"></canvas>
  <script type="module">
    import MeshGradient from "https://esm.sh/mesh-gradient.js";

    function mulberry32(seed) {
      return function() {
        let t = (seed += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    const seedValue = ${SEED};
    const rng = seedValue ? mulberry32(seedValue) : Math.random;
    if (seedValue) Math.random = rng;

    const gradient = new MeshGradient();
    gradient.initGradient('#canvas', ${JSON.stringify(COLORS)});
    gradient.setCanvasSize(${WIDTH}, ${HEIGHT});

    const animate = ${SHOULD_ANIMATE};
    const fps = 30;
    const runningTime = ${TIME} * fps
    const capturer = new CCapture({ format: 'webm', quality: 100, framerate: fps });
    const frames = runningTime;

    let t = seedValue ? 0 : Math.random() * 1000;
    const speed = 0.05;
    let frameCount = 0;
    const interval = 1000 / fps;

    if (animate) capturer.start();

    function renderFrame() {
      gradient.changePosition(t);
      if (animate) capturer.capture(document.querySelector('canvas'));
      t += speed;
      frameCount++;


      if (frameCount < frames) {
        setTimeout(renderFrame, interval);
      } else if (animate) {
        capturer.stop();
        capturer.save(blob => {
          window.finalBlob = blob;
          window.ready = true;
        });
      } else {
        window.ready = true;
      }
    }

    renderFrame();
  </script>
</body>
</html>
`;

		res.send(html);
	});

	app.get('/gradient', validate({ query }), async (req, res) => {
		const { SEED, WIDTH, HEIGHT, COLORS, SHOULD_ANIMATE, TIME } = parseQuery(req.query);

		const browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox'] });
		const page = await browser.newPage();

		await page.setViewport({ width: WIDTH, height: HEIGHT });

		const url = `http://localhost:${PORT}/render?colors=${COLORS.map((c) => c.replace('#', '')).join(',')}&dimensions=${WIDTH}x${HEIGHT}&animate=${SHOULD_ANIMATE}&seed=${isNaN(SEED) ? 0 : SEED}&time=${TIME}`;

		await page.goto(url, { waitUntil: 'networkidle0' });

		await page.waitForFunction('window.ready === true', { timeout: 0 });

		let buffer;
		let contentType;

		if (SHOULD_ANIMATE) {
			const blobBuffer = await page.evaluate(async () => {
				const arrayBuffer = await window.finalBlob.arrayBuffer();

				return Array.from(new Uint8Array(arrayBuffer));
			});

			buffer = await webmToMp4Buffer(Buffer.from(blobBuffer));

			contentType = 'video/mp4';
		} else {
			buffer = await page.screenshot({ omitBackground: false });
			contentType = 'image/png';
		}

		await browser.close();

		res.setHeader('Content-Type', contentType);
		res.setHeader('Content-Disposition', `inline; filename="gradient.${SHOULD_ANIMATE ? 'mp4' : 'png'}"`);
		res.end(buffer);
	});

	app.listen(PORT, () => {
		loggers.info(color('Server Mesh Gradient', 'white'), color('started on port', '#E4C1F9'), color(PORT, 'white'));
	});
};

async function webmToMp4Buffer(inputBuffer) {
	return new Promise((resolve, reject) => {
		const ffmpeg = spawn('ffmpeg', [
			'-i',
			'pipe:0',
			'-f',
			'mp4',
			'-movflags',
			'frag_keyframe+empty_moov',
			'-preset',
			'ultrafast',
			'-an',
			'pipe:1'
		]);

		const chunks = [];
		let stderr = '';

		ffmpeg.stdout.on('data', (chunk) => chunks.push(chunk));
		ffmpeg.stderr.on('data', (data) => (stderr += data.toString()));

		ffmpeg.on('close', (code) => {
			if (code === 0) {
				resolve(Buffer.concat(chunks));
			} else {
				reject(new Error(`ffmpeg exited with code ${code}: ${stderr}`));
			}
		});

		ffmpeg.stdin.write(inputBuffer);
		ffmpeg.stdin.end();
	});
}
