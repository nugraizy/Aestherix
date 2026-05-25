import asyncRetry from 'async-retry';
import dayjs from 'dayjs';
import { exec } from 'child_process';
import fs from 'fs-extra';

import { color, isURL, loggers } from '../modules/index.js';

export const toMp4 = (input, sender) =>
	new Promise(async (resolve, reject) => {
		try {
			const time = dayjs().unix();

			exec(`ffmpeg -i "${input}" "./src/media/temporary_files/${sender}${time}.mp4"`, async (err) => {
				if (err) {
					if (!isURL(input)) {
						await fs.unlink(input);
					}

					loggers.error(color('File processing failed:', 'red'), err);
					reject(err);
				}

				const buffer = await fs.readFile(`./src/media/temporary_files/${sender}${time}.mp4`);

				await fs.unlink(`./src/media/temporary_files/${sender}${time}.mp4`);
				resolve(buffer);
			});
		} catch (err) {
			loggers.error(color('File processing failed:', 'red'), err);
			reject(err);
		}
	});

export const gifToMp4 = (input, sender) =>
	new Promise(async (resolve, reject) => {
		try {
			const time = dayjs().unix();

			exec(
				`ffmpeg -i "${input}" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "./temporary_files/${sender}${time}.mp4"`,
				async (err) => {
					if (err) {
						if (!isURL(input)) {
							await fs.unlink(input);
						}

						loggers.error(color('File processing failed:', 'red'), err);
						reject(err);
					}

					const buffer = await fs.readFile(`./src/media/temporary_files/${sender}${time}.mp4`);

					await fs.unlink(`./src/media/temporary_files/${sender}${time}.mp4`);
					resolve(buffer);
				}
			);
		} catch (err) {
			loggers.error(color('File processing failed:', 'red'), err);
			reject(err);
		}
	});

export const gif2mp4 = (input, output) =>
	new Promise((resolve, reject) => {
		exec(
			`ffmpeg -i "${input}" -movflags faststart -pix_fmt yuv420p -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "${output}"`,
			(err) => {
				if (err) {
					loggers.error(`${color('Failed to Convert Gif to Video', 'red')}`);
					reject(err);
					return;
				}

				loggers.info(`${color('Converted Media', 'pink')}`);
				resolve({ output });
			}
		);
	});

export const mp42mp3 = (input, output, sender) =>
	new Promise(async (resolve, reject) => {
		exec(`ffmpeg -i "${input}" "${output.slice(-3) !== 'mp3' ? `${output}.mp3` : output}"`, (err) => {
			if (err) {
				loggers.error(`${color('Failed to Convert Video to Audio', 'red')} for ${color(sender, 'lilac')}`);
				reject(err);
				return;
			}

			loggers.info(`${color('Converted Media', 'pink')} for ${color(sender, 'lilac')}`);
			resolve({ output: output.slice(-3) !== 'mp3' ? `${output}.mp3` : output });
		});
	});

export const mergeVideoWithAudio = (video, audio, output, sender, referer) =>
	new Promise(async (resolve, reject) => {
		let command = 'ffmpeg ';

		if (referer) {
			command += `-headers "User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.81 Safari/537.36"$'\r\n'"Referer: ${referer}"$'\r\n' `;
		}

		command += `-i "${video}" `;
		command += `-i "${audio}" -c:v copy -c:a copy "${output}"`;

		try {
			loggers.warning(`${color('Merging files', 'pink')}`);
			asyncRetry(
				() => {
					exec(command, async (err) => {
						if (err) {
							loggers.error(`${color('Failed to Merge Audio to Video', 'red')}`);
							reject(err);
							return;
						}

						loggers.info(`${color('Completed merging', 'pink')}`);
						const buffer = await fs.readFile(output);

						await fs.unlink(output);
						resolve(buffer);
					});
				},
				{ retries: 5 }
			);
		} catch (err) {
			loggers.error(`${color('Failed to Merge Audio to Video', 'red')} for ${color(sender, 'lilac')}`);
			reject(err);
		}
	});
