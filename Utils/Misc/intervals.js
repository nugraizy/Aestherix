import moment from "moment-timezone";

const intervals = global.intervals;

export const SetIntervals = async (dari, time, callback) => {
	intervals.set(dari, {
		timer: null,
		startsAt: new Date().getTime(),
		endsAt: moment(new Date()).add(parseInt(time), "seconds").valueOf(),
		intervals: setInterval(callback, 1000),
	});
};

export const CheckIntervals = (dari) => {
	const interval = intervals.get(dari);
	if (interval == undefined) return 0;
	return {
		timer: interval.timer,
		startsTimestamp: interval.startsTimestamp,
		endsTimestamp: interval.endsTimestamp,
		startsReadable: interval.startsReadable,
		endsReadable: interval.endsReadable,
		interval: interval.intervals,
	};
};

export const CheckAllIntervals = () =>
	Array.from(intervals.entries()).map(([key, value]) => ({
		[key]: value,
	}));

export const DeleteIntervals = (dari) => {
	const interval = intervals.get(dari);
	if (interval == undefined) return 0;
	clearInterval(interval.intervals);
	intervals.delete(dari);
};
