import { execFile } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import sharp from 'sharp';

import { videoFormat as VIDEO_MIMETYPE } from '../misc/mimetype.js';
import { color, loggers } from '../modules/index.js';

export const convertMediaToSticker = (filePath, sender, output, mimetype) =>
	new Promise(async (resolve, reject) => {
		const pathExif = './tmp/data.exif';
		let pathSticker = filePath;

		if (!(await fs.exists(pathSticker))) {
			pathSticker = `./tmp/${pathSticker}`;
		}

		loggers.warning(`${color('Converting Media', 'pink')} for ${color(sender, 'lilac')}`);

		if (filePath.endsWith('webp') && (await fs.exists(filePath))) {
			execFile('webpmux', ['-set', 'exif', pathExif, pathSticker, '-o', `${pathSticker}-done.webp`], async (err, stdout, stderr) => {
				if (err) {
					loggers.error(`${color('Failed to Convert Media to Sticker', 'red')} for ${color(sender, 'lilac')}`);
					await fs.unlink(pathSticker).catch(() => {});
					return reject(stderr);
				}

				const buffer = await fs.readFile(`${pathSticker}-done.webp`);

				await fs.unlink(`${pathSticker}-done.webp`).catch(() => {});
				await fs.unlink(pathSticker).catch(() => {});
				loggers.info(`${color('Converted Media', 'pink')} for ${color(sender, 'lilac')}`);
				resolve(buffer);
			});
		} else if (filePath.endsWith('jpeg')) {
			execFile(
				'ffmpeg',
				['-i', pathSticker, '-vcodec', 'libwebp', '-vf', 'scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,setsar=1,fps=fps=30', '-lossless', '0', '-an', '-vsync', '0', '-s', '512:512', `${pathSticker}.webp`],
				async (err) => {
					if (err) {
						loggers.error(`${color('Failed to Convert Media to Sticker', 'red')} for ${color(sender, 'lilac')}`);
						await fs.unlink(pathSticker).catch(() => {});
						return reject(err);
					}

					execFile('webpmux', ['-set', 'exif', pathExif, `${pathSticker}.webp`, '-o', `${pathSticker}-done.webp`], async (err) => {
						if (err) {
							loggers.error(`${color('Failed to Convert Media to Sticker', 'red')} for ${color(sender, 'lilac')}`);
							await fs.unlink(`${pathSticker}-done.webp`).catch(() => {});
							await fs.unlink(pathSticker).catch(() => {});
							await fs.unlink(`${pathSticker}.webp`).catch(() => {});
							return reject(err);
						}

						const buffer = await fs.readFile(`${pathSticker}-done.webp`);

						await fs.unlink(`${pathSticker}-done.webp`).catch(() => {});
						await fs.unlink(pathSticker).catch(() => {});
						await fs.unlink(`${pathSticker}.webp`).catch(() => {});
						loggers.info(`${color('Converted Media', 'pink')} for ${color(sender, 'lilac')}`);
						resolve(buffer);
					});
				}
			);
		} else {
			pathSticker = output ? output : pathSticker;
			const ffmpegArgs = ['-i', filePath];

			if (!pathSticker.includes('.webp')) {
				ffmpegArgs.push(
					'-vcodec', 'libwebp', '-vf',
					'scale=512:512:flags=lanczos:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000,setsar=1,fps=fps=10',
					'-lossless', '0', '-preset', 'default', '-ss', '00:00:00', '-t', '00:00:10', '-an', '-vsync', '0', '-s', '512:512'
				);
			}

			ffmpegArgs.push(mimetype && VIDEO_MIMETYPE.includes(mimetype) ? `${pathSticker}.webp` : pathSticker);

			execFile('ffmpeg', ffmpegArgs, async (er) => {
					if (er) {
						loggers.error(`${color('Failed to Convert Media to Sticker', 'red')} for ${color(sender, 'lilac')}`);
						await fs.unlink(pathSticker).catch(() => {});
						return reject(er);
					}

					const webpPath = VIDEO_MIMETYPE.includes(mimetype) ? `${pathSticker}.webp` : pathSticker;

					execFile('webpmux', ['-set', 'exif', pathExif, webpPath, '-o', `${pathSticker}-done.webp`], async (err) => {
						if (err) {
							loggers.error(`${color('Failed to Convert Media to Sticker', 'red')} for ${color(sender, 'lilac')}`);
							await fs.unlink(pathSticker).catch(() => {});
							return reject(err);
						}

						const buffer = await fs.readFile(`${pathSticker}-done.webp`);

						await fs.unlink(`${pathSticker}-done.webp`).catch(() => {});
						await fs.unlink(pathSticker).catch(() => {});
						await fs.unlink(`${pathSticker}.webp`).catch(() => {});
						loggers.info(`${color('Converted Media', 'pink')} for ${color(sender, 'lilac')}`);
						resolve(buffer);
					});
				}
			);
		}
	});

export const convertStickerToMedia = (input, sender) =>
	new Promise(async (resolve, reject) => {
		try {
			const isInputBuffer = Buffer.isBuffer(input);

			function isAnimatedWebp(buffer) {
				return buffer.length > 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.includes(Buffer.from('ANIM'));
			}

			if (isInputBuffer && isAnimatedWebp(input)) {
				const buffer = isInputBuffer ? input : await fs.readFile(input);
				const time = Date.now();
				const frameDir = `./tmp/${sender}_${time}_frames`;
				const outputPath = `./tmp/${sender}_${time}.mp4`;

				await fs.ensureDir(frameDir);

				const webpmux = (await import('node-webpmux')).default;
				const img = new webpmux.Image();

				await img.load(buffer);

				const frameBufs = await img.demux({ buffers: true });
				const frameCount = frameBufs.length;
				const totalDuration = img.anim.frames.reduce((sum, f) => sum + (f.delay || 100), 0);
				const fps = Math.round((frameCount / totalDuration) * 1000) || 15;

				for (let i = 0; i < frameCount; i++) {
					const png = await sharp(frameBufs[i]).png().toBuffer();

					await fs.writeFile(path.join(frameDir, `frame_${String(i).padStart(4, '0')}.png`), png);
				}

				const resultBuffer = await new Promise((resolve, reject) => {
					execFile(
						'ffmpeg',
						['-framerate', String(fps), '-i', `${frameDir}/frame_%04d.png`, '-movflags', 'faststart', '-pix_fmt', 'yuv420p', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2', outputPath],
						async (err) => {
							await fs.remove(frameDir).catch(() => {});

							if (err) {
								await fs.unlink(outputPath).catch(() => {});
								return reject(err);
							}

							const out = await fs.readFile(outputPath);

							await fs.unlink(outputPath).catch(() => {});
							resolve(out);
						}
					);
				});

				loggers.info(`${color('Converted Media', 'pink')} for ${color(sender, 'lilac')}`);
				resolve({ result: resultBuffer, isVideo: true });
				return;
			}

			const buffer = isInputBuffer ? input : await fs.readFile(input);
			const resultBuffer = await sharp(buffer).png().toBuffer();

			loggers.info(`${color('Converted Media', 'pink')} for ${color(sender, 'lilac')}`);
			resolve({ result: resultBuffer, isVideo: false });
		} catch (err) {
			reject(err);
		}
	});
