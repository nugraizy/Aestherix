export const emojimix = (emoji1, emoji2) =>
	new Promise(async (resolve) => {
		try {
			const data = await fetchJSON(URL_BASE(emoji1, emoji2));
			if (data.results.length == 0) return resolve({ error: "No results found." });
			const { url } = data.results[0];
			resolve(url);
		} catch (err) {
			resolve({ error: err.message });
		}
	});

const URL_BASE = (emoji1, emoji2) => `https://tenor.googleapis.com/v2/featured?key=AIzaSyAyimkuYQYF_FXVALexPuGQctUWRURdCYQ&contentfilter=high&media_filter=png_transparent&component=proactive&collection=emoji_kitchen_v5&q=${emoji1}_${emoji2}`;
