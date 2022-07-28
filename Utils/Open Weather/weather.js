import axios from "axios";
export const openWeatherAPI = async function (q, type) {
	try {
		let info;
		let data;
		switch (type) {
			case "geo":
				let geo = q.split("|");
				info = await axios.get(
					`https://api.openweathermap.org/data/2.5/weather?lat=${geo[0]}&lon=${geo[1]}&appid=6507c04b8f51f3b862e4f84bdfad8a1c&units=metric&lang=id`
				);
				data = {
					status: 200,
					desc: info.data.weather[0].description,
					temp: info.data.main.temp + "°C",
					feels: info.data.main.feels_like + "°C",
					press: info.data.main.pressure + " hPa",
					humi: info.data.main.humidity + "%",
					visible: (info.data.visibility / 1000).toFixed(1) + " km",
					wind: info.data.wind.speed + " m/s",
					name: info.data.name,
					id: info.data.id,
				};
				break;
			case "city":
				info = await axios.get(
					`https://api.openweathermap.org/data/2.5/weather?q=${q}&appid=6507c04b8f51f3b862e4f84bdfad8a1c&units=metric&lang=id`
				);
				data = {
					status: 200,
					desc: info.data.weather[0].description,
					temp: info.data.main.temp + "°C",
					feels: info.data.main.feels_like + "°C",
					press: info.data.main.pressure + " hPa",
					humi: info.data.main.humidity + "%",
					visible: (info.data.visibility / 1000).toFixed(1) + " km",
					wind: info.data.wind.speed + " m/s",
					name: info.data.name,
					id: info.data.id,
				};
				break;
		}
		return data;
	} catch (e) {
		console.log(e);
		return { message: `${e}` };
	}
};