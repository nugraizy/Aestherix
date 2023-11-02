import isOnline from 'is-online';

export default async function isInternetAvailable() {
	const online = await isOnline();

	return online;
}
