import dayjs from 'dayjs';

const URL_VISUAL = (input) => `https://akcdn.detik.net.id/visual/${input}`;

export const parseIndonesia = (arr) =>
	arr.map((v) => {
		v.strisi = v.strisi.replace(/<[^>]*>/g, '');
		return {
			title: v.strjudul,
			body: v.strisi,
			places: v.strnmkota,
			published: v.dtnewsdate,
			image: URL_VISUAL(`${v.image[0].strnmfile + v.image[0].extension}?w=1080`),
			link: v.url
		};
	});

export const parseInternational = (arr) =>
	arr.map((v) => ({
		title: v.headline,
		body: v.body,
		published: dayjs(v.firstPublishDate).format('HH:mm:ss DD/MM/YYYY'),
		image: v.thumbnail || 'No thumbnail',
		link: v.url
	}));
