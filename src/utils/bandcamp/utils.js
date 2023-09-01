export const parseCookie = (arr) => arr.map((v) => v.split(';')[0]).join('; ');

export const parseSearch = (arr) => {
	arr = arr.filter((v) => v.type === 't');
	return arr.map(
		({
			art_id: artId,
			name,
			band_id: bandId,
			band_name: bandName,
			album_id: albumId,
			item_url_path: itemUrlPath,
			stat_params: statParams,
			album_name: albumName
		}) => ({
			bandId,
			bandName,
			title: name,
			albumName: albumName || null,
			albumId: albumId || null,
			urlBase: `${itemUrlPath}?${statParams}`,
			thumbnailUrl: `https://f4.bcbits.com/img/a${artId}_5.jpg`
		})
	);
};

export const parseDownload = (obj) => ({
	title: obj?.trackinfo?.[0]?.title || null,
	mp3: obj?.trackinfo?.[0]?.file?.['mp3-128'] || null
});
