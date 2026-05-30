const KV_KEY = 'tools_panel_states';

const DEFAULT_PANELS = [
	{
		id: 'downloader',
		name: 'All-in-One Downloader',
		description: 'Paste a URL and download media from 15+ platforms.',
		icon: 'nf-md-download_circle',
		category: 'media'
	},
	{
		id: 'comics-reader',
		name: 'Comics Reader',
		description: 'Search, read, and download manga/comics as PDF.',
		icon: 'nf-md-book_open_page_variant',
		category: 'media'
	},
	{
		id: 'converter',
		name: 'File Converter',
		description: 'Convert images, audio, and video between formats.',
		icon: 'nf-md-swap_horizontal',
		category: 'converter'
	},
	{
		id: 'currency',
		name: 'Currency Converter',
		description: 'Real-time exchange rates for 30+ currencies.',
		icon: 'nf-md-currency_usd',
		category: 'converter'
	},
	{
		id: 'calculator',
		name: 'Calculator',
		description: 'Basic math, percentages, and unit conversions.',
		icon: 'nf-md-calculator',
		category: 'utility'
	},
	{
		id: 'color-converter',
		name: 'Color Converter',
		description: 'Convert between hex, RGB, HSL with preview.',
		icon: 'nf-md-palette',
		category: 'utility'
	},
	{
		id: 'qr-generator',
		name: 'QR Code Generator',
		description: 'Generate QR codes from text or URLs.',
		icon: 'nf-md-qrcode',
		category: 'utility'
	},
	{
		id: 'json-formatter',
		name: 'Code Formatter',
		description: 'Format, minify, and highlight JSON, JS, HTML, CSS.',
		icon: 'nf-md-code_braces',
		category: 'utility'
	},
	{
		id: 'timestamp',
		name: 'Timestamp Converter',
		description: 'Convert between Unix timestamps and dates.',
		icon: 'nf-md-clock_outline',
		category: 'utility'
	}
];

export function createToolsService({ prisma } = {}) {
	if (!prisma) {
		throw new Error('tools.service: prisma is required');
	}

	async function loadStates() {
		try {
			const row = await prisma.dashboardKV.findUnique({
				where: { key_sessionName: { key: KV_KEY, sessionName: 'main' } }
			});

			return row?.value ? JSON.parse(row.value) : {};
		} catch {
			return {};
		}
	}

	async function saveStates(states) {
		await prisma.dashboardKV.upsert({
			where: { key_sessionName: { key: KV_KEY, sessionName: 'main' } },
			update: { value: JSON.stringify(states) },
			create: { key: KV_KEY, sessionName: 'main', value: JSON.stringify(states) }
		});
	}

	async function listPanels() {
		const states = await loadStates();

		return DEFAULT_PANELS.map((panel) => ({
			...panel,
			state: states[panel.id] || 'enabled'
		}));
	}

	async function setPanelState(id, state) {
		const panel = DEFAULT_PANELS.find((p) => p.id === id);

		if (!panel) {
			return { ok: false, message: 'Panel not found.' };
		}

		if (!['enabled', 'disabled', 'maintenance'].includes(state)) {
			return { ok: false, message: 'Invalid state. Use enabled, disabled, or maintenance.' };
		}

		const states = await loadStates();

		states[id] = state;
		await saveStates(states);

		return { ok: true, panel: { ...panel, state } };
	}

	async function download(url) {
		const service = detectService(url);

		if (!service) {
			return {
				ok: false,
				message:
					'Unsupported URL. Supported: YouTube, TikTok, Instagram, Twitter, Facebook, Pinterest, Bilibili, Bluesky, Bandcamp, Spotify, Flickr, DeviantArt, MediaFire.'
			};
		}

		try {
			const handler = await loadHandler(service);

			if (!handler) {
				return { ok: false, message: `${service} handler is not available yet.` };
			}

			const result = await handler(url);

			return { ok: true, service, ...result };
		} catch (error) {
			return { ok: false, message: error?.message || `Failed to process ${service} URL.` };
		}
	}

	function detectService(url) {
		const patterns = {
			youtube: /(?:youtube\.com|youtu\.be)/i,
			tiktok: /(?:tiktok\.com|vm\.tiktok\.com)/i,
			instagram: /instagram\.com/i,
			twitter: /(?:twitter\.com|x\.com)/i,
			facebook: /(?:facebook\.com|fb\.watch)/i,
			pinterest: /pinterest\.com/i,
			bilibili: /(?:bilibili\.com|bilibili\.tv|b23\.tv)/i,
			bluesky: /bsky\.app/i,
			bandcamp: /bandcamp\.com/i,
			spotify: /open\.spotify\.com/i,
			flickr: /flickr\.com/i,
			deviantart: /deviantart\.com/i,
			mediafire: /mediafire\.com/i,
			douyin: /douyin\.com/i
		};

		for (const [name, pattern] of Object.entries(patterns)) {
			if (pattern.test(url)) {
				return name;
			}
		}

		return null;
	}

	async function loadHandler(service) {
		const handlers = {
			async youtube(url) {
				const { default: youtube } = await import('../../../src/utils/youtube/index.js');
				const isPlaylist = /[?&]list=/.test(url) && !/[?&]v=/.test(url);

				if (isPlaylist) {
					const playlist = await youtube.playlist(url);

					return {
						title: playlist.title || 'YouTube Playlist',
						thumbnail: playlist.videos[0]?.thumbnails?.at(-1)?.url || null,
						playlist: playlist.videos.map((entry) => ({
							id: entry.id,
							title: entry.title,
							url: `https://youtu.be/${entry.id}`,
							duration: entry.durationSeconds,
							thumbnail: entry.thumbnails?.at(-1)?.url || null
						})),
						formats: []
					};
				}

				const video = await youtube.client.getVideo(url);
				const formats = video.formats;
				const muxed = formats
					.withAudioChannels()
					.select((format) => format.width > 0)
					.sort()[0];
				const bestVideo = formats.type('avc1').sort()[0];
				const bestAudio = formats.type('audio/mp4').sortByBitrateDesc()[0] || formats.type('audio').sortByBitrateDesc()[0];
				const out = [];

				if (muxed) {
					out.push({ url: muxed.url, label: `Video ${muxed.qualityLabel || ''}`.trim() });
				}

				if (bestAudio) {
					out.push({ url: bestAudio.url, label: 'Audio' });
				}

				return {
					title: video.title || 'YouTube Video',
					thumbnail: video.thumbnails?.at(-1)?.url || null,
					merge:
						bestVideo && bestAudio && bestVideo.audioChannels === 0 ? { video: bestVideo.url, audio: bestAudio.url } : null,
					formats: out
				};
			},
			async tiktok(url) {
				const { tiktok } = await import('../../../src/utils/tiktok/index.js');
				const result = await tiktok.download.post([url]);
				const key = Object.keys(result)[0];
				const post = result?.[key];

				if (post?.error) {
					throw new Error(post.error);
				}

				const formats = [];
				const urls = post?.urls || {};

				if (urls.withNoWatermark) {
					formats.push({ url: urls.withNoWatermark, label: 'No Watermark' });
				}

				if (urls.withoutWatermarkHighest) {
					formats.push({ url: urls.withoutWatermarkHighest, label: 'HD No Watermark' });
				}

				if (urls.withWatermark) {
					formats.push({ url: urls.withWatermark, label: 'With Watermark' });
				}

				if (urls.music) {
					formats.push({ url: urls.music, label: 'Audio' });
				}

				if (post?.type === 'images' && urls.images) {
					for (const img of urls.images) {
						const imgUrl = typeof img === 'string' ? img : img?.url;

						if (imgUrl) {
							formats.push({ url: imgUrl, label: 'Image' });
						}
					}
				}

				const thumb = null;

				return { title: post?.videoDescription || 'TikTok', thumbnail: thumb, formats };
			},
			async instagram(url) {
				const configuration = (await import('../../../src/helper/config/connect.js')).default;
				const ig = configuration?.instagram;

				if (!ig?.download?.post) {
					throw new Error('Instagram requires the bot to be logged in. Run the instagram-init command first.');
				}

				const storyMatch = url.match(/\/stories\/([^/]+)/);
				const highlightMatch = url.match(/\/highlights?\//i) || url.match(/instagram\.com\/([^/]+)\/?$/);

				if (storyMatch) {
					const username = storyMatch[1];

					if (!ig?.search?.story) {
						throw new Error('Instagram requires the bot to be logged in.');
					}

					const result = await ig.search.story([username]);
					const data = result?.[username] || result?.[Object.keys(result || {})[0]];

					if (data?.error) {
						throw new Error(data.error);
					}

					const stories = data?.stories || [];

					if (!stories.length) {
						throw new Error('No stories available for this user.');
					}

					return {
						title: `@${username} Stories (${stories.length})`,
						thumbnail: null,
						formats: stories.map((s, i) => ({ url: s.url, label: `${s.isVideo ? 'video' : 'image'} ${i + 1}` }))
					};
				}

				if (highlightMatch && !url.includes('/p/') && !url.includes('/reel/')) {
					const username = highlightMatch[1] || url.split('/').filter(Boolean).pop();

					if (!ig?.search?.highlight) {
						throw new Error('Instagram requires the bot to be logged in.');
					}

					const result = await ig.search.highlight([username]);
					const data = result?.[username] || result?.[Object.keys(result || {})[0]];

					if (data?.error) {
						throw new Error(data.error);
					}

					const highlights = data?.highlights || [];

					if (!highlights.length) {
						throw new Error('No highlights available for this user.');
					}

					const formats = [];

					for (const h of highlights) {
						for (const item of h.dataHighlight || []) {
							if (item.url) {
								formats.push({ url: item.url, label: `${h.title} - ${item.type} ` });
							}
						}
					}

					return {
						title: `@${username} Highlights (${highlights.length} reels, ${formats.length} items)`,
						thumbnail: highlights[0]?.thumbnail || null,
						formats
					};
				}

				const result = await ig.download.post([url]);
				const post = result?.[Object.keys(result)[0]];

				if (post?.error) {
					throw new Error(post.error);
				}

				const medias = post?.post || [];

				return {
					title: post?.captions?.slice(0, 100) || 'Instagram Post',
					thumbnail: null,
					formats: medias.map((m, i) => ({ url: m.url, label: `${m.isVideo ? 'video' : 'image'} ${i + 1}` }))
				};
			},
			async twitter(url) {
				const { Twitter } = await import('../../../src/utils/twitter/index.js');
				const tw = new Twitter({ cookie: process.env.TWITTER_COOKIE || '' });
				const post = await tw.download(url);

				if (post?.error) {
					throw new Error(post.error);
				}

				return {
					title: post?.text?.slice(0, 100) || 'Tweet',
					thumbnail: null,
					formats: (post?.medias || []).map((m, i) => ({ url: m.url, label: `${m.type || 'media'} ${i + 1}` }))
				};
			},
			async facebook(url) {
				const { facebookDownloader } = await import('../../../src/utils/facebook/index.js');
				const data = await facebookDownloader(url);

				return {
					title: data?.title || 'Facebook Video',
					thumbnail: data?.thumbnail || null,
					formats: [data?.sd && { url: data.sd, label: 'SD' }, data?.hd && { url: data.hd, label: 'HD' }].filter(Boolean)
				};
			},
			async pinterest(url) {
				const { pinterest } = await import('../../../src/utils/pinterest/index.js');
				const data = await pinterest.download(url);

				if (data?.error) {
					throw new Error(data.message || 'Pinterest download failed');
				}

				return {
					title: data?.caption || 'Pinterest Pin',
					thumbnail: null,
					formats: data?.url ? [{ url: data.url, label: data.type || 'image' }] : []
				};
			},
			async bilibili(url) {
				const { bilibiliDetailTv } = await import('../../../src/utils/bilibili/index.js');
				const match = url.match(/\d{5,}/);

				if (!match) {
					throw new Error('Could not extract video ID from URL');
				}

				const data = await bilibiliDetailTv({ aid: match[0] });

				if (!data) {
					throw new Error('Video not found');
				}

				return {
					title: data?.title || 'Bilibili Video',
					thumbnail: data?.cover || null,
					merge: data.video && data.audio ? { video: data.video, audio: data.audio } : null,
					formats: []
				};
			},
			async bluesky(url) {
				const { bluesky } = await import('../../../src/utils/index.js');
				const post = await bluesky.getPost(url);

				if (post?.error) {
					throw new Error(post.error);
				}

				const formats = [];

				if (post?.images) {
					post.images.forEach((img) =>
						formats.push({ url: typeof img === 'string' ? img : img.fullsize || img.url, label: 'image' })
					);
				}

				if (post?.videos) {
					post.videos.forEach((vid) => formats.push({ url: typeof vid === 'string' ? vid : vid.url, label: 'video' }));
				}

				return { title: (post?.caption || post?.text || '').slice(0, 100) || 'Bluesky Post', thumbnail: null, formats };
			},
			async bandcamp(url) {
				const { downloadBandcamp } = await import('../../../src/utils/bandcamp/index.js');
				const data = await downloadBandcamp(url);

				if (data?.error) {
					throw new Error(data.error);
				}

				return {
					title: data?.title || 'Bandcamp Track',
					thumbnail: data?.thumbnail || null,
					formats: data?.mp3 ? [{ url: data.mp3, label: 'audio' }] : []
				};
			},
			async spotify(url) {
				const { spotifier } = await import('../../../src/utils/spotifier/index.js');
				const trackId = url.match(/track\/([a-zA-Z0-9]+)/)?.[1];

				if (!trackId) {
					throw new Error('Invalid Spotify track URL');
				}

				const data = await spotifier.getTracks(trackId);

				if (!data?.status || !data?.tracks?.length) {
					throw new Error(data?.message || 'Track not found');
				}

				const track = data.tracks[0];

				return {
					title: `${track.name} — ${track.artists?.map((a) => a.name).join(', ') || ''}`,
					thumbnail: track.album?.images?.[0]?.url || null,
					formats: track.preview_url ? [{ url: track.preview_url, label: 'Preview (30s)' }] : []
				};
			},
			async flickr(url) {
				const { FlickerAPI } = await import('../../../src/utils/flickr/search-images.js');
				const photoId = url.match(/\/photos\/[^/]+\/(\d+)/)?.[1];

				if (!photoId) {
					throw new Error('Invalid Flickr URL — could not extract photo ID');
				}

				const flickr = new FlickerAPI();
				const detail = await flickr.detailImage(photoId);
				const preview = detail?.download?.replace('_o_d.', '_b_d.') || null;

				return {
					title: detail?.title || 'Flickr Photo',
					thumbnail: preview,
					formats: detail?.download ? [{ url: detail.download, label: 'image (original)' }] : []
				};
			},
			async deviantart(url) {
				const { downloadDeviantArt } = await import('../../../src/utils/deviant-art/index.js');
				const data = await downloadDeviantArt(url);

				if (data?.error) {
					throw new Error(data.error);
				}

				return {
					title: data?.title || 'DeviantArt',
					thumbnail: data?.preview || null,
					formats: data?.image ? [{ url: data.image, label: 'image' }] : []
				};
			},
			async mediafire(url) {
				const { mediafire: mf } = await import('../../../src/utils/file-hosting/index.js');
				const data = await mf(url);

				if (data?.error) {
					throw new Error(data.error);
				}

				return {
					title: data?.filename || 'File',
					thumbnail: null,
					formats: data?.dlLink ? [{ url: data.dlLink, label: `Download (${data.filesize || '?'})` }] : []
				};
			},
			async douyin(url) {
				const { getDouyinInfo } = await import('../../../src/utils/tiktok/index.js');
				const data = await getDouyinInfo(url);

				if (data?.error) {
					throw new Error(data.error);
				}

				return {
					title: data?.desc || 'Douyin',
					thumbnail: data?.cover || null,
					formats: data?.video ? [{ url: data.video, label: 'Video' }] : []
				};
			}
		};

		return handlers[service] || null;
	}

	return { listPanels, setPanelState, download };
}
