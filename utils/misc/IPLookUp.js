import { fetchJSON } from '../../helper/index.js';

const URL_API = (input) =>
	`http://ip-api.com/json/${input}?fields=status,message,continent,continentCode,country,countryCode,region,regionName,city,district,zip,lat,lon,timezone,offset,currency,isp,org,as,asname,reverse,mobile,proxy,hosting,query`;

export const IPLookup = (input) =>
	new Promise(async (resolve, reject) => {
		try {
			const noData = 'No Data';
			const {
				status,
				continent,
				continentCode,
				country,
				countryCode,
				region,
				regionName,
				city,
				district,
				zip,
				lat,
				lon,
				timezone,
				offset,
				currency,
				isp,
				org,
				as,
				asname,
				reverse,
				mobile,
				proxy,
				hosting,
				message,
			} = await fetchJSON(URL_API(input));

			if (status != 'success') {
				resolve({ error: message });
			}

			resolve({
				continent,
				continentCode,
				country,
				countryCode,
				region,
				regionName,
				city,
				district: district == '' ? noData : district,
				zip: zip == '' ? noData : zip,
				lat,
				lon,
				timezone,
				offset,
				currency,
				isp,
				org,
				as,
				asname,
				reverse: reverse == '' ? noData : reverse,
				mobile,
				proxy,
				hosting,
			});
		} catch (err) {
			reject(err);
		}
	});
