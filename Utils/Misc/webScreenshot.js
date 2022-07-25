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
			const response = await fetchBUFFER(`https://api.screenshotmachine.com/?key=${process.env.WEB_SCREENSHOT}&url=${url}&${type}`);
			const buffer = Buffer.from(response);
			resolve({
				buffer,
			});
		} catch (error) {
			reject(error);
		}
	});
