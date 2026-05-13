import { fetch } from 'undici';

async function downloadBuffer(url) {
	const response = await fetch(url, { redirect: 'follow' });

	if (!response.ok) {
		throw new Error(`Download failed with status ${response.status}`);
	}

	return Buffer.from(await response.arrayBuffer());
}

export { downloadBuffer };
