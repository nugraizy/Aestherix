import fetch from "node-fetch";

export const getEarthquake = async () =>
	new Promise(async (resolve, reject) => {
		try {
			const { gempa } = (await (await fetch(URL_INDONESIA_WITHOUT_IMAGE)).json()).Infogempa;
			let {
				Tanggal: date,
				Jam: time,
				DateTime: dateTime,
				Coordinates: coordinates,
				Lintang: latitude,
				Bujur: longitude,
				Magnitude: magnitude,
				Kedalaman: depth,
				Wilayah: region,
				Potensi: potency,
				Dirasakan: feel,
				Shakemap: shakemap,
			} = (await (await fetch(URL_INDONESIA_WITH_IMAGE)).json()).Infogempa.gempa;
			shakemap = `https://ews.bmkg.go.id/TEWS/data/${shakemap}`;
			const results = [
				{
					date,
					time,
					dateTime,
					coordinates,
					latitude,
					longitude,
					magnitude,
					depth,
					region,
					potency,
					feel,
					shakemap,
				},
			];
			for (const data of gempa) {
				let { Tanggal: date, Jam: time, DateTime: dateTime, Coordinates: coordinates, Lintang: latitude, Bujur: longitude, Magnitude: magnitude, Kedalaman: depth, Wilayah: region, Potensi: potency } = data;
				results.push({
					date,
					time,
					dateTime,
					coordinates,
					latitude,
					longitude,
					magnitude,
					depth,
					region,
					potency,
				});
			}
			resolve(results);
		} catch (err) {
			reject({ error: err });
		}
	});
const URL_WORLD = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";
const URL_INDONESIA_WITH_IMAGE = "https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json";
const URL_INDONESIA_WITHOUT_IMAGE = "https://data.bmkg.go.id/DataMKG/TEWS/gempaterkini.json";
