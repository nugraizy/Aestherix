import { extension as extensi, lookup } from 'mime-types';
import fs from 'fs-extra';

const [videoFormat, audioFormat, imageFormat] = await Promise.all([
	fs.readFile('./databases/mimetypes/Video.json'),
	fs.readFile('./databases/mimetypes/Audio.json'),
	fs.readFile('./databases/mimetypes/Image.json'),
]);

/**
 * Find the mimetype for the filetype.
 * @param {string} input
 * @returns {lookup(input) as string | 'audio/mpeg' | 'audio/ogg' | 'audio/wav' | 'audio/opus' | 'application/octet-stream'}
 */
export const mime = (input) => {
	switch (input) {
		case 'mp3':
			return 'audio/mpeg';
		case 'ogg':
			return 'audio/ogg';
		case 'wav':
			return 'audio/wav';
		case 'opus':
			return 'audio/opus';
		default:
			return lookup(input) || 'application/octet-stream';
	}
};

/**
 * Find the extension for the filetype.
 * @param {string} input
 * @returns {extensi(input) as string | 'mp3' | 'ogg' | 'wav' | 'opus' | 'mp3'}
 */
export const extension = (input) => {
	switch (input) {
		case 'audio/mpeg':
			return 'mp3';
		case 'audio/ogg':
			return 'ogg';
		case 'audio/wav':
			return 'wav';
		case 'audio/opus':
			return 'opus';
		default:
			return extensi(input) || 'mp3';
	}
};

/**
 * Checks what is the correct format for the file to be sent.
 * @param {string} input mimetypes of the files
 * @returns {'video' | 'image' | 'audio' | null}
 */
export const whatFormat = (input) => {
	if (!input) {
		return null;
	}

	return videoFormat.includes(input)
		? 'video'
		: imageFormat.includes(input)
		? 'image'
		: audioFormat.includes(input)
		? 'audio'
		: 'document';
};
