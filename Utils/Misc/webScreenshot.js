import dotenv from "dotenv";
dotenv.config();
import fetch from "node-fetch";

export const getScreenshot = async (url, type) =>
	new Promise(async (resolve, reject) => {
		try {
			switch (type) {
				case "phone":
					type = "dimension=400x800&device=phone";
					break;
				case "tablet":
					type = "dimension=800x1280&device=tablet";
					break;
				case "desktop":
					type = "dimension=1024x768&device=desktop";
					break;
				default:
					type = "dimension=1024x768&device=desktop";
					break;
			}
			const response = await fetch(`https://api.screenshotmachine.com/?key=${process.env.WEB_SCREENSHOT}&url=${url}&${type}`).then((res) => res.arrayBuffer());
			const buffer = Buffer.from(response);
			resolve({
				buffer,
			});
		} catch (error) {
			reject(error);
		}
	});
