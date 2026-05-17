import { spawn } from 'child_process';
import { Router } from 'express';
import { z } from 'zod';

import { validate } from '../dashboard/server/middleware/validation.middleware.js';

const DEFAULT_DIMENSIONS = '1280x720';
const DEFAULT_COLORS = '295C96,D0CBC7,899FB6';
const DEFAULT_TIME = 2;

const gradientQuery = {
	colors: z.string().optional(),
	dimensions: z
		.string()
		.regex(/^\d+x\d+$/)
		.optional(),
	animate: z
		.string()
		.transform((value) => value === 'true')
		.optional(),
	time: z
		.string()
		.transform((value) => parseInt(value, 10))
		.optional(),
	seed: z
		.string()
		.transform((value) => parseInt(value, 10))
		.optional()
};

function parseQuery(query) {
	const { colors, dimensions, animate, seed, time } = query;
	const SEED = seed !== 'undefined' && seed !== undefined ? Number(seed) : Math.floor(Math.random() * 10_000);
	const [WIDTH, HEIGHT] = (dimensions || DEFAULT_DIMENSIONS).split('x').map(Number);
	const COLORS = (colors || DEFAULT_COLORS).split(',').map((value) => `#${value}`);
	const SHOULD_ANIMATE = animate === true;
	const TIME = time ? Number(time) : DEFAULT_TIME;

	return { SEED, WIDTH, HEIGHT, COLORS, SHOULD_ANIMATE, TIME };
}

function buildRenderHtml({ SEED, WIDTH, HEIGHT, COLORS, SHOULD_ANIMATE, TIME, port }) {
	return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Mesh Gradient</title>
  <script src="http://localhost:${port}/build/CCapture.all.min.js"></script>
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
}

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

export function createGradientRouter({ port = Number(process.env.DASHBOARD_PORT || 4000) } = {}) {
	const router = Router();

	router.get('/render', validate({ query: gradientQuery }), (req, res) => {
		const params = parseQuery(req.query);

		res.send(buildRenderHtml({ ...params, port }));
	});

	router.get('/gradient', validate({ query: gradientQuery }), async (req, res) => {
		const params = parseQuery(req.query);
		const { SEED, WIDTH, HEIGHT, COLORS, SHOULD_ANIMATE, TIME } = params;

		const { default: puppeteer } = await import('puppeteer');
		const browser = await puppeteer.launch({ headless: 'shell', args: ['--no-sandbox'] });
		const page = await browser.newPage();

		try {
			await page.setViewport({ width: WIDTH, height: HEIGHT });

			const url =
				`http://localhost:${port}/render` +
				`?colors=${COLORS.map((c) => c.replace('#', '')).join(',')}` +
				`&dimensions=${WIDTH}x${HEIGHT}` +
				`&animate=${SHOULD_ANIMATE}` +
				`&seed=${Number.isNaN(SEED) ? 0 : SEED}` +
				`&time=${TIME}`;

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

			res.setHeader('Content-Type', contentType);
			res.setHeader('Content-Disposition', `inline; filename="gradient.${SHOULD_ANIMATE ? 'mp4' : 'png'}"`);
			res.end(buffer);
		} finally {
			await browser.close();
		}
	});

	return router;
}
