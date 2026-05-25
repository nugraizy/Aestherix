import ms from 'parse-ms';

export const getTimeSince = (dates) => {
	const time = Date.now() - dates;
	const dateString = ms(time);

	return (
		(dateString.days ? `${dateString.days} day${dateString.days > 1 ? 's' : ''} ` : '') +
		(dateString.hours ? `${dateString.hours} hour${dateString.hours > 1 ? 's' : ''} ` : '') +
		(dateString.minutes ? `${dateString.minutes} minute${dateString.minutes > 1 ? 's' : ''} ` : '') +
		(dateString.seconds ? `${dateString.seconds} second${dateString.seconds > 1 ? 's' : ''} ` : '')
	);
};

export const getRuntime = (time) => {
	const date = new Date(time * 1000);
	const dates = {
		year: date.getUTCFullYear(),
		month: date.getUTCMonth(),
		day: date.getUTCDate(),
		hour: date.getUTCHours(),
		minute: date.getUTCMinutes(),
		second: date.getUTCSeconds()
	};

	return (
		(dates.month - 1 > 0 ? `${dates.month - 1} month${dates.month - 1 > 1 ? 's' : ''} ` : '') +
		(dates.day - 1 > 0 ? `${dates.day - 1} day${dates.day - 1 > 1 ? 's' : ''} ` : '') +
		(dates.hour > 0 ? `${dates.hour} hour${dates.hour > 1 ? 's' : ''} ` : '') +
		(dates.minute > 0 ? `${dates.minute} minute${dates.minute > 1 ? 's' : ''} ` : '') +
		(dates.second > 0 ? `${dates.second} second${dates.second > 1 ? 's' : ''} ` : '')
	);
};

export const getSeconds = (dates) => {
	const time = Date.now() - dates;
	const dateString = ms(time);

	return dateString.seconds;
};

export const delay = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const delaySync = (ms) => {
	const start = Date.now();

	while (Date.now() - start <= ms) {
		// intentionally blocking
	}
};

export class Timer {
	#startTime = null;
	#endTime = null;
	#format;

	constructor(format = '${ms} ms') {
		this.#format = format;
	}

	start() {
		this.#startTime = process.hrtime.bigint();
		this.#endTime = null;
	}

	stop() {
		if (!this.#startTime) {
			throw new Error('Timer has not been started.');
		}

		this.#endTime = process.hrtime.bigint();
	}

	reset() {
		this.#startTime = null;
		this.#endTime = null;
	}

	elapsed() {
		if (!this.#startTime) {
			return 0n;
		}

		const end = this.#endTime ?? process.hrtime.bigint();

		return Number(end - this.#startTime) / 1e6;
	}

	formatted() {
		const ms = this.elapsed();
		const s = ms / 1000;
		const m = Math.floor(s / 60);
		const remainingS = s % 60;

		return this.#format
			.replace('${ms}', ms.toFixed(2))
			.replace('${s}', s.toFixed(2))
			.replace('${m}', m.toString())
			.replace('${sec}', remainingS.toFixed(2));
	}

	toString() {
		return this.formatted();
	}
}
