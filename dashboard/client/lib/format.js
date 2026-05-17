export function formatTrackTime(ms) {
	const totalSeconds = Math.max(0, Math.floor(Number(ms || 0) / 1000));
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;

	return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

const ANSI_PATTERN = /\u001b\[[0-9;]*m/g;

export function stripAnsi(text) {
	return String(text || '').replace(ANSI_PATTERN, '');
}

export function formatBytes(bytes) {
	const value = Number(bytes || 0);

	if (!Number.isFinite(value) || value <= 0) {
		return '0 B';
	}

	const units = ['B', 'KB', 'MB', 'GB'];
	let i = 0;
	let n = value;

	while (n >= 1024 && i < units.length - 1) {
		n /= 1024;
		i += 1;
	}

	return `${n.toFixed(n < 10 && i ? 1 : 0)} ${units[i]}`;
}
