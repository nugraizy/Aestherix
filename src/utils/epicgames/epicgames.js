import { fetch } from 'undici';
import fs from 'fs-extra';

const graphql = await fs.readFile(new URL('./StoreQuery.graphql', import.meta.url), { encoding: 'utf-8' });

export const epicgamesFree = () =>
	new Promise(async (resolve, reject) => {
		try {
			const data = await fetch('https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions?country=ID', {
				headers: {
					'Content-Type': 'application/json'
				}
			});

			const json = await data.json();

			if (!json.data.Catalog.searchStore.elements.length) {
				resolve({ error: 'No result.' });
			}

			resolve(json.data.Catalog.searchStore.elements);
		} catch (error) {
			reject(error);
		}
	});

export const epicgames = (query) =>
	new Promise(async (resolve, reject) => {
		try {
			const data = await fetch('https://graphql.epicgames.com/graphql', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					query: graphql,
					variables: {
						keywords: query,
						country: 'ID',
						locale: 'id-ID'
					}
				})
			});

			const json = await data.json();

			if (!json.data.Catalog.searchStore.elements.length) {
				resolve({ error: 'No result. Try Other keywords.' });
			}

			resolve(json.data.Catalog.searchStore.elements);
		} catch (error) {
			reject(error);
		}
	});
