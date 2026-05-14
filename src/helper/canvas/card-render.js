import fs from 'fs-extra';
import path from 'path';
import { fetch } from 'undici';
import { fileURLToPath } from 'url';
import { renderRadarChart } from './genshin-radar.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = path.join(__dirname, '../../media/genshin/card-template.svg');

async function toBase64(url) {
	if (!url) {
		return '';
	}

	try {
		const res = await fetch(url);
		const buffer = Buffer.from(await res.arrayBuffer());
		const mime = res.headers.get('content-type') || 'image/png';

		return `data:${mime};base64,${buffer.toString('base64')}`;
	} catch {
		return '';
	}
}

const ELEMENT_MAP = {
	Anemo: {
		class: 'Wind',
		bg: 'rgb(117, 194, 168)',
		accent: 'linear-gradient(0deg, #2d6d5e 0%, #1a4a3f 100%)',
		highlight: 'rgb(165, 255, 214)'
	},
	Geo: {
		class: 'Rock',
		bg: 'rgb(207, 163, 56)',
		accent: 'linear-gradient(0deg, #7a5e13 0%, #4a3800 100%)',
		highlight: 'rgb(255, 220, 130)'
	},
	Electro: {
		class: 'Electric',
		bg: 'rgb(150, 107, 199)',
		accent: 'linear-gradient(0deg, #4b2d7a 0%, #2d1a4a 100%)',
		highlight: 'rgb(200, 165, 255)'
	},
	Dendro: {
		class: 'Grass',
		bg: 'rgb(45, 142, 52)',
		accent: 'linear-gradient(0deg, #136013 0%, #074707 100%)',
		highlight: 'rgb(165, 255, 171)'
	},
	Hydro: {
		class: 'Water',
		bg: 'rgb(56, 133, 207)',
		accent: 'linear-gradient(0deg, #134a7a 0%, #072d4a 100%)',
		highlight: 'rgb(130, 200, 255)'
	},
	Pyro: {
		class: 'Fire',
		bg: 'rgb(207, 89, 56)',
		accent: 'linear-gradient(0deg, #7a2013 0%, #4a0d07 100%)',
		highlight: 'rgb(255, 165, 130)'
	},
	Cryo: {
		class: 'Ice',
		bg: 'rgb(117, 194, 224)',
		accent: 'linear-gradient(0deg, #2d5e7a 0%, #1a3f4a 100%)',
		highlight: 'rgb(165, 230, 255)'
	}
};

const STAT_ICON_PATHS = {
	FIGHT_PROP_HP:
		'M3.5 7.654a.98.98 0 0 1 .449-.571c1.51-.85 3.586 2.117 6.544.548 1.927 6.083-8.893 6.247-6.992.023zM7 14c-3.373 0-6.75-2.421-5.134-7.26A18.5 18.5 0 0 1 6.57.213.75.75 0 0 1 7 0a.75.75 0 0 1 .432.212 18.5 18.5 0 0 1 4.705 6.528C13.749 11.579 10.376 14 7 14m.22-12.19A.6.6 0 0 0 7 1.735a.7.7 0 0 0-.22.075C5.07 3.134 2.7 7.092 2.839 9.21A4.02 4.02 0 0 0 7 12.753a4.02 4.02 0 0 0 4.162-3.538c.139-2.123-2.231-6.081-3.942-7.405',
	FIGHT_PROP_HP_PERCENT:
		'M3.5 7.654a.98.98 0 0 1 .449-.571c1.51-.85 3.586 2.117 6.544.548 1.927 6.083-8.893 6.247-6.992.023zM7 14c-3.373 0-6.75-2.421-5.134-7.26A18.5 18.5 0 0 1 6.57.213.75.75 0 0 1 7 0a.75.75 0 0 1 .432.212 18.5 18.5 0 0 1 4.705 6.528C13.749 11.579 10.376 14 7 14m.22-12.19A.6.6 0 0 0 7 1.735a.7.7 0 0 0-.22.075C5.07 3.134 2.7 7.092 2.839 9.21A4.02 4.02 0 0 0 7 12.753a4.02 4.02 0 0 0 4.162-3.538c.139-2.123-2.231-6.081-3.942-7.405',
	FIGHT_PROP_ATTACK:
		'm7.755 1.651 1.643 1.643 1.928-1.926L11.3.25a.23.23 0 0 1 .228-.22h2.2a.23.23 0 0 1 .228.229c-.121 2.66.556 2.457-1.337 2.4l-1.933 1.925L12.33 6.23a.23.23 0 0 1 0 .322c-1.167 1.208-.775.907-1.892-.106l-7.151 7.147a.46.46 0 0 1-.313.137 21 21 0 0 1-2.954.238 21 21 0 0 1 .238-2.953.45.45 0 0 1 .134-.319l7.146-7.153-.838-.839a.23.23 0 0 1 0-.323l.732-.73a.23.23 0 0 1 .322 0z',
	FIGHT_PROP_ATTACK_PERCENT:
		'm7.755 1.651 1.643 1.643 1.928-1.926L11.3.25a.23.23 0 0 1 .228-.22h2.2a.23.23 0 0 1 .228.229c-.121 2.66.556 2.457-1.337 2.4l-1.933 1.925L12.33 6.23a.23.23 0 0 1 0 .322c-1.167 1.208-.775.907-1.892-.106l-7.151 7.147a.46.46 0 0 1-.313.137 21 21 0 0 1-2.954.238 21 21 0 0 1 .238-2.953.45.45 0 0 1 .134-.319l7.146-7.153-.838-.839a.23.23 0 0 1 0-.323l.732-.73a.23.23 0 0 1 .322 0z',
	FIGHT_PROP_DEFENSE:
		'M13.442.726a.29.29 0 0 0-.175-.268C12.859.286 11.503 0 7 0S1.143.286.735.458a.29.29 0 0 0-.176.269v7.44a.87.87 0 0 0 .125.453c1.579 2.6 5.347 4.855 6.16 5.339a.29.29 0 0 0 .3 0c.79-.482 4.56-2.688 6.169-5.335a.87.87 0 0 0 .127-.455zM7 11.968c.059.013-3.56-2.017-4.824-4.368V1.565s0-.452 4.824-.452z',
	FIGHT_PROP_DEFENSE_PERCENT:
		'M13.442.726a.29.29 0 0 0-.175-.268C12.859.286 11.503 0 7 0S1.143.286.735.458a.29.29 0 0 0-.176.269v7.44a.87.87 0 0 0 .125.453c1.579 2.6 5.347 4.855 6.16 5.339a.29.29 0 0 0 .3 0c.79-.482 4.56-2.688 6.169-5.335a.87.87 0 0 0 .127-.455zM7 11.968c.059.013-3.56-2.017-4.824-4.368V1.565s0-.452 4.824-.452z',
	FIGHT_PROP_ELEMENT_MASTERY:
		'm8.076 8.152-.017-.05A4.3 4.3 0 0 0 7.3 6.796a4 4 0 0 0-.325-.346A2.113 2.113 0 1 0 7 2.223a2.144 2.144 0 0 0-1.838 3.18 4.4 4.4 0 0 0-1.2-.168 4.4 4.4 0 0 0-.755.066l-.038.007C1.836-.24 10.7-1.672 10.962 4.342a3.985 3.985 0 0 1-2.886 3.81m3.662-2.137a4 4 0 0 0-.626-.235 4.5 4.5 0 0 1-1.105 1.7h.031a2.113 2.113 0 1 1-2.113 2.113 4 4 0 0 0-.025-.445 3.97 3.97 0 0 0-1.863-2.931l-.19-.11a3.963 3.963 0 1 0 .645 6.535q.122-.102.236-.214L6.7 12.39a4.4 4.4 0 0 1-.891-1.765 2.112 2.112 0 1 1-.883-2.914q.1.05.189.11a2.11 2.11 0 0 1 .942 1.49 2 2 0 0 1 .018.28 3.963 3.963 0 1 0 5.663-3.577z',
	FIGHT_PROP_CRITICAL:
		'M14 0 7.256 3.5 1.973 1.465 3.5 6.236 0 14l7.256-3.5 4.771 1.527L10.5 7.256Zm-3.24 3.24L8.88 7.136 9.701 9.7l-2.564-.82-3.898 1.88 1.88-4.17-.82-2.565L7.137 5.12Z',
	FIGHT_PROP_CRITICAL_HURT: 'm0 14 3.5-7.764-1.527-4.772L7.255 3.5 14 0l-3.5 7.255 1.527 4.772L7.255 10.5z',
	FIGHT_PROP_CHARGE_EFFICIENCY:
		'M7.607.607v2.344a4.03 4.03 0 0 1 4.047 4.047 4.03 4.03 0 0 1-4.047 4.047 4.03 4.03 0 0 1-3.578-2.17l1.727-.348L1.87 4.123 0 9.689l1.67-.337c.942 2.36 3.251 4.039 5.937 4.039C11.123 13.39 14 10.517 14 7S11.123.607 7.607.607',
	FIGHT_PROP_FIRE_ADD_HURT:
		'M7.113 14c-1.542-1.47-3.479-2.25-5.16-3.477-1.472-1.1-.269-3.047.585-4.163a18 18 0 0 0 1.753-2.522c-.007 1.6 1.56 2.152 2.781 2.709C4.77 6.412 2.808 9.1 4.645 10.92c-1.873-.773-2.7-2.455-1.3-4.17a2.113 2.113 0 0 0-.535 3.662c1.332.9 2.865 1.483 4.153 2.461a.2.2 0 0 0 .187.019c1.24-.892 2.61-1.577 3.921-2.349 1.654-.887 1.47-2.773-.154-3.583 1.455 2.82-1.213 4.942-3.9 4.745-2.925-.214-3.08-3.174-.626-2.705a1.39 1.39 0 0 0-.682 1.5c.526 1.495 2.954.974 3.81.031 1.095-1.027.327-3.031-.979-3.6-1.492-.7-4.443-1.527-3.3-3.737C5.936 2.109 6.75 1.385 6.877 0c.433.581 1.443 1.719 1.24 2.452-.24.72-1.085.982-1.348 1.71a1.334 1.334 0 0 0 .578 1.824c-1.018-1.09.09-2.409 1.15-2.981a3.3 3.3 0 0 0 1.136 4.056c-.725-1.6-1.347-1.64-.128-3.408a4.58 4.58 0 0 0 1.806 2.766c2.057 1.807 1.9 3.731-.52 5.067A16.7 16.7 0 0 0 7.112 14Z',
	FIGHT_PROP_WATER_ADD_HURT:
		'm2.923 12.245.253.13a7.94 7.94 0 0 0 3.89.963 3.753 3.753 0 0 0 .487-7.464 3.6 3.6 0 0 0-1.691.132.938.938 0 0 1-.716-1.732 4.3 4.3 0 0 1 1.48-.366 4.91 4.91 0 0 1 5.049 3.446 4.93 4.93 0 0 1-2.517 5.764c4.218-1.543 4.723-7.809.812-10.017a5.34 5.34 0 0 0-3.437-.829 5.5 5.5 0 0 0-3.65 1.775 7 7 0 0 0-.416.524.87.87 0 0 1-.927.337.93.93 0 0 1-.781-.638.88.88 0 0 1 .1-.684 6.2 6.2 0 0 1 1.363-1.721A7.1 7.1 0 0 1 6.136.081a6.93 6.93 0 0 1 6.848 3.359c2.683 4.1-.263 9.987-5.094 10.472a6.84 6.84 0 0 1-3.241-.343 4 4 0 0 1-1.726-1.324',
	FIGHT_PROP_ELEC_ADD_HURT:
		'M4.53 13.517a6.9 6.9 0 0 0 3.025-.468c-.237-.073-.46-.134-.675-.21a9 9 0 0 1-.643-.251 3.9 3.9 0 0 1-2.24-2.243 3.45 3.45 0 0 1-.127-1.82c.117.139.222.277.34.4a1.04 1.04 0 0 0 1.01.32A1.57 1.57 0 0 0 6.499 7.89a2.42 2.42 0 0 0-2.083-2.8 2.99 2.99 0 0 0-3.217 2.152 7.1 7.1 0 0 0-.326 2.186c-.005.309 0 .618 0 .9A7.1 7.1 0 0 1 .01 6.593a6.95 6.95 0 0 1 2.679-5.081c-.26.472-.52.917-.752 1.374a3.7 3.7 0 0 0-.412 1.52c.207-.192.385-.36.566-.523a4.66 4.66 0 0 1 2.155-1.161 3.57 3.57 0 0 1 3.075.79l-.442.09a1.213 1.213 0 0 0-.881 1.693 2.01 2.01 0 0 0 1.719 1.34 2.575 2.575 0 0 0 2.873-2.56 3.33 3.33 0 0 0-1.1-2.508A7.8 7.8 0 0 0 7.287.102C7.235.078 7.183.05 7.106.012a7 7 0 0 1 6.892 5.915c-.282-.45-.544-.9-.836-1.328a3.7 3.7 0 0 0-1.11-1.087c.08.37.172.72.227 1.077a4.09 4.09 0 0 1-.792 3.364 3.55 3.55 0 0 1-1.51 1.017.1.1 0 0 1-.048 0c.062-.2.134-.39.184-.587a1.09 1.09 0 0 0-.525-1.236A1.68 1.68 0 0 0 7.823 7.1a2.357 2.357 0 0 0-1.168 2.96 2.75 2.75 0 0 0 2.377 1.879 4.37 4.37 0 0 0 2.462-.5c.465-.215.9-.5 1.344-.76.056-.031.108-.07.18-.118a6.92 6.92 0 0 1-8.487 2.955z',
	FIGHT_PROP_ICE_ADD_HURT:
		'M1.172 3.644s1.332 2.052 1.843 3.163q.078-.298.124-.602a6.25 6.25 0 0 1 3.337.506A6.25 6.25 0 0 1 4.37 4.068q.24-.192.46-.408c-1.217.112-3.658-.016-3.658-.016ZM5.426 6.1a7.2 7.2 0 0 0-2.314-.552 3.4 3.4 0 0 0-.193-.9c.303-.053.598-.147.876-.279A7.2 7.2 0 0 0 5.426 6.1Zm-4.254 4.256s1.332-2.052 1.843-3.163q.078.298.124.602a6.25 6.25 0 0 0 3.337-.506A6.25 6.25 0 0 0 4.37 9.932q.24.192.46.408c-1.217-.112-3.658.016-3.658.016zM5.426 7.9a7.2 7.2 0 0 1-2.314.552 3.5 3.5 0 0 1-.193.9c.303.053.598.147.876.279A7.2 7.2 0 0 1 5.426 7.9ZM7 13.75s-1.11-2.177-1.815-3.175q.297.081.583.193A6.24 6.24 0 0 0 7 7.626a6.25 6.25 0 0 0 1.232 3.143q.284-.111.578-.193C8.106 11.574 7 13.75 7 13.75Zm0-4.912a7.2 7.2 0 0 1-.675 2.284q.381.264.68.62.299-.356.68-.62A7.2 7.2 0 0 1 7 8.838Zm5.828 1.518s-1.331-2.052-1.843-3.163q-.077.298-.123.602a6.25 6.25 0 0 1-3.338-.506A6.26 6.26 0 0 1 9.63 9.932q-.24.192-.46.408c1.217-.112 3.657.016 3.657.016zM8.574 7.9a7.2 7.2 0 0 0 2.314.552q.036.464.193.9a3.4 3.4 0 0 0-.877.279A7.2 7.2 0 0 0 8.574 7.9Zm4.254-4.256s-1.331 2.052-1.843 3.163a6 6 0 0 1-.123-.602 6.25 6.25 0 0 0-3.338.506A6.26 6.26 0 0 0 9.63 4.068a6 6 0 0 1-.46-.408c1.217.112 3.657-.016 3.657-.016ZM8.574 6.1a7.2 7.2 0 0 1 2.314-.552 3.5 3.5 0 0 1 .193-.9 3.4 3.4 0 0 1-.877-.279A7.2 7.2 0 0 1 8.574 6.1ZM7 .25S5.89 2.426 5.185 3.424q.297-.082.583-.193A6.24 6.24 0 0 1 7 6.374a6.25 6.25 0 0 1 1.232-3.143q.284.111.578.193C8.106 2.426 7 .25 7 .25Zm0 4.912a7.2 7.2 0 0 0-.675-2.284 3.5 3.5 0 0 0 .68-.62q.299.356.68.62A7.2 7.2 0 0 0 7 5.162Zm1.103 2.853-.068.787-.718-.334H6.68l-.717.334-.065-.787-.32-.557-.649-.454.649-.453.32-.553.068-.788.717.335h.64l.718-.335.068.788.32.55.648.454-.648.454Z',
	FIGHT_PROP_WIND_ADD_HURT:
		'M.2 4.905c.764 1.2 1.813 2.475 3.362 2.434 1.025-.067 2.374.224 2.679 1.36.313.864-.825 1.981-1.513 1.123-.108-.186-.04-.3.173-.325 1 .02 1.348-1.12.4-1.514-.813-.1-1.548.527-2.33.707C.792 9.32-.523 6.729.2 4.907zm9.912 2.43c-1.056-.074-2.45.563-2.375 1.785a.973.973 0 0 0 1.1.985c.316.012.724-.547.294-.613-1.621 0-1.022-2.1.346-1.4a5.2 5.2 0 0 0 2.343.687c1.8-.177 2.572-2.3 1.989-3.859-.871 1.303-1.957 2.597-3.697 2.414zm-2.42-.772a7.5 7.5 0 0 0 2.226-.861A3.067 3.067 0 0 0 9.286.09a5.14 5.14 0 0 1-1.594 6.473m-1.343-.014A5.07 5.07 0 0 1 4.734.07a3.075 3.075 0 0 0-1.122 5.287 8 8 0 0 0 2.7 1.235zm5.342-.09c-1.143.656-2.594.363-3.651 1.217a1.557 1.557 0 0 0 .07 2.768c.234.1.462.206.689.014.223-.167.4-.162.72-.012a9.1 9.1 0 0 0-2.512 3.482 9.2 9.2 0 0 0-2.523-3.478.605.605 0 0 1 .726 0c.6.347 1.443-.4 1.555-1 .247-1.179-.936-2.106-1.982-2.33-.512-.12-1.038-.182-1.55-.3C.866 6.337.51 3.94 1.669 2.105c.668 4.9 4 3.555 5.332 6.26 1.32-2.67 4.678-1.382 5.345-6.26.81 1.415 1.054 3.522-.655 4.354M7.57 11.65 7 11.271l-.572.385.58.972zM7 10.137a1.6 1.6 0 0 1-1 .911.925.925 0 0 0 .99-.272c.427.327.795.417 1.047.255A1.56 1.56 0 0 1 7 10.137',
	FIGHT_PROP_ROCK_ADD_HURT:
		'M7.119 6.009c-.5.538-.953 1.041-1.42 1.537a.23.23 0 0 0-.061.286 4.5 4.5 0 0 0 1.355 1.719.18.18 0 0 0 .164-.009c.388-.257.785-.5 1.15-.788a16 16 0 0 0 2.142-1.993c.18.366.382.7.518 1.063.2.535.356 1.088.535 1.632a.29.29 0 0 1-.061.286 12.3 12.3 0 0 1-1.768 1.985c-.84.755-1.714 1.47-2.574 2.2A1 1 0 0 1 6.99 14c-.5-.411-1.02-.817-1.52-1.243a29 29 0 0 1-2.847-2.774A16.8 16.8 0 0 1 .529 7.137a.245.245 0 0 1 0-.279A10 10 0 0 1 1.875 5.1a25.3 25.3 0 0 0 5.158 8.241 12.4 12.4 0 0 0 2.98-4.617l-.036-.03-2.933 2.463c-.04-.032-.081-.061-.117-.1a13.5 13.5 0 0 1-2.562-3.364.25.25 0 0 1 .05-.356c.5-.442 1-.89 1.5-1.325.227-.194.474-.365.737-.566zm.228 2.545c.263-.2.51-.372.736-.566.506-.435 1-.883 1.5-1.325a.25.25 0 0 0 .05-.356 13.5 13.5 0 0 0-2.56-3.369c-.035-.034-.076-.063-.115-.1L4.025 5.306l-.04-.03A12.35 12.35 0 0 1 6.97.659 25.3 25.3 0 0 1 12.126 8.9a10 10 0 0 0 1.345-1.758.24.24 0 0 0 0-.279 16.7 16.7 0 0 0-2.1-2.846 29 29 0 0 0-2.842-2.774C8.03.817 7.514.411 7.009 0c-.05.033-.081.049-.107.071-.86.732-1.734 1.447-2.573 2.2A12.2 12.2 0 0 0 2.56 4.258a.29.29 0 0 0-.062.286c.179.544.334 1.1.536 1.632.136.361.336.7.517 1.063a16 16 0 0 1 2.14-1.993c.367-.285.765-.531 1.152-.788a.18.18 0 0 1 .164-.009 4.5 4.5 0 0 1 1.355 1.719.23.23 0 0 1-.06.286c-.468.5-.926 1-1.421 1.537z',
	FIGHT_PROP_GRASS_ADD_HURT:
		'M173.68 70.934 157.051 90.29l-16.638-19.355a26.29 26.29 0 0 1-2.289-31.14l18.927-29.957 18.917 29.957a26.29 26.29 0 0 1-2.29 31.14M278.71 174.201l-.855.625.647.558c-7.591 42.959-41.853 61.798-61.338 71.13-22.027 10.537-60.09 32.247-60.09 57.779 0-25.532-38.073-47.242-60.1-57.779-19.497-9.332-53.758-28.171-61.338-71.119l.657-.57-.876-.635a102.4 102.4 0 0 1-1.325-16.747c0-55.861 44.382-80.451 72.148-80.451 20.965 0 36.146 12.541 42.269 18.697a5.53 5.53 0 0 1 .712 6.944l-4.458 6.846a2.65 2.65 0 0 1-4.305.197c-5.816-7.295-23.22-24.25-53.56-12.925-22.685 8.489-36.88 29.574-36.88 54.766 0 25.193 15.564 61.81 56.31 76.914s50.724 39.519 50.724 39.519 9.979-24.415 50.725-39.52c40.746-15.104 56.31-51.72 56.31-76.913s-14.239-46.233-36.857-54.7c-30.363-11.348-47.778 5.608-53.562 12.903a2.65 2.65 0 0 1-4.304-.197l-4.458-6.846a5.55 5.55 0 0 1 .712-6.944c6.177-6.2 21.315-18.698 42.268-18.698 27.778 0 72.149 24.58 72.149 80.452a102.4 102.4 0 0 1-1.325 16.714M36.25 174.826l-.658.57c-.076-.395-.153-.8-.208-1.206zM139.199 211.125c-34.69-30.494-42.718-50.769-34.853-69.006 7.864-18.237 29.716-10.887 29.716-10.887-18.698-19.387-34.492-15.762-43.255-10.855a29.3 29.3 0 0 0-12.048 13.144c-7.12 15.06-.624 29.64 10.35 42.017-6.922.57-15.476 3.548-20.405 13.625 0 0 5.093-5.224 12.048-6.133 6.956-.91 13.91-1.282 19.3 3.066 17.865 15.116 39.147 25.029 39.147 25.029M51.704 86.62a18.37 18.37 0 0 0-17.459-15.981l-22.3-.91 5.224 18.402a19.96 19.96 0 0 0 21.906 14.327l14.393-1.983zM36.25 174.826l-.658.57-8.642 7.48a13.144 13.144 0 0 1-15.904 1.03l-10.953-7.23 11.468-8.444a13.14 13.14 0 0 1 15.586 0l8.27 5.958zM278.71 174.201a22 22 0 0 1-.208 1.183l-.647-.558zM174.906 211.125c34.678-30.494 42.718-50.769 34.842-69.006C201.873 123.882 180 131.2 180 131.2c18.697-19.387 34.492-15.762 43.266-10.855a29.3 29.3 0 0 1 12.048 13.144c7.109 15.06.624 29.64-10.35 42.017 6.922.57 15.465 3.549 20.405 13.626 0 0-5.093-5.225-12.048-6.134-6.956-.91-13.911-1.282-19.3 3.067-17.832 15.148-39.114 25.06-39.114 25.06M262.39 86.62a18.39 18.39 0 0 1 17.459-15.981l22.311-.91-5.224 18.402a19.98 19.98 0 0 1-21.907 14.327l-14.392-1.983zM313.957 176.71l-10.953 7.229a13.144 13.144 0 0 1-15.893-1.03l-8.653-7.492-.647-.559.855-.624 8.193-6.002a13.14 13.14 0 0 1 15.597 0z'
};

function getSubstatIconPath(fightProp) {
	return STAT_ICON_PATHS[fightProp] || STAT_ICON_PATHS.FIGHT_PROP_ATTACK;
}

const PERCENT_PROPS = new Set(['FIGHT_PROP_HP_PERCENT', 'FIGHT_PROP_ATTACK_PERCENT', 'FIGHT_PROP_DEFENSE_PERCENT']);

function statIconSvg(fightProp, size = 14) {
	const baseProp = fightProp.replace('_PERCENT', '');
	const iconPath = STAT_ICON_PATHS[baseProp] || STAT_ICON_PATHS[fightProp] || STAT_ICON_PATHS.FIGHT_PROP_ATTACK;
	const isPercent = PERCENT_PROPS.has(fightProp);

	const SECONDARY_PATHS = {
		FIGHT_PROP_CRITICAL_HURT:
			'<path fill="currentColor" opacity="0.5" d="M7.045.19a6.76 6.76 0 0 0-3.326.857l3.613 1.392L10.168.967A6.65 6.65 0 0 0 7.045.189zM1.502 3.073A6.8 6.8 0 0 0 .309 6.947c0 .925.189 1.808.529 2.612l1.601-3.555-.937-2.93zm11.63.998-1.571 3.26 1.076 3.361a6.71 6.71 0 0 0 .496-6.621zm-5.8 7.489-3.11 1.5a6.7 6.7 0 0 0 6.436-.436z"/>',
		FIGHT_PROP_CHARGE_EFFICIENCY:
			'<path fill="currentColor" opacity="0.5" d="M3.562 7.002a4.03 4.03 0 0 1 4.045-4.049L7.606.608C4.09.61 1.216 3.487 1.216 7.003Z"/>'
	};
	const secondPath = SECONDARY_PATHS[fightProp] || SECONDARY_PATHS[baseProp] || '';

	const ELEMENT_COLORS = {
		FIGHT_PROP_FIRE_ADD_HURT: '#ff6b35',
		FIGHT_PROP_WATER_ADD_HURT: '#4fc3f7',
		FIGHT_PROP_ELEC_ADD_HURT: '#ce93d8',
		FIGHT_PROP_ICE_ADD_HURT: '#a5d6f7',
		FIGHT_PROP_WIND_ADD_HURT: '#80cbc4',
		FIGHT_PROP_ROCK_ADD_HURT: '#ffd54f',
		FIGHT_PROP_GRASS_ADD_HURT: '#a5d610'
	};
	const color = ELEMENT_COLORS[fightProp] || ELEMENT_COLORS[baseProp] || 'currentColor';
	const pct = isPercent
		? `<g transform="matrix(1.3 0 0 1.3 -4.22 -4.231)" style="stroke:#000;stroke-width:1.85;stroke-miterlimit:4;"><path fill="${color}" stroke="none" d="M12.27 9.17h1.19q.074.025.055.086-2.895 4.03-3.423 4.687-.03.067-.129.055h-.76q-.135 0-.16-.074 2.988-4 3.196-4.398.031-.05.031-.11 0-.068-.08-.19.013-.056.08-.056M8.804 10.3q0-.288.086-.51.086-.226.233-.38.153-.16.362-.239.208-.086.454-.086.251 0 .46.086.209.08.356.24.153.153.239.38.086.22.086.509 0 .282-.086.51-.086.22-.24.38-.146.153-.355.239-.209.08-.46.08-.246 0-.454-.08-.209-.086-.362-.24-.147-.16-.233-.38-.086-.227-.086-.51Zm1.589 0q0-.196-.037-.35-.03-.153-.092-.257-.055-.11-.141-.166-.086-.061-.184-.061-.104 0-.19.06-.08.056-.141.167-.056.104-.092.257-.031.154-.031.35t.03.35q.037.153.093.263.06.11.14.166.087.055.19.055.099 0 .185-.055t.141-.166q.061-.11.092-.263.037-.154.037-.35m1.331 2.313q0-.289.086-.51.086-.226.233-.38.153-.16.362-.24.209-.085.454-.085.251 0 .46.086.209.08.356.24.153.153.24.38.085.22.085.509 0 .282-.086.509-.086.22-.24.38-.146.154-.355.24-.209.08-.46.08-.245 0-.454-.08-.209-.086-.362-.24-.147-.16-.233-.38-.086-.227-.086-.51zm1.589-.019q0-.196-.037-.35-.03-.153-.092-.257-.055-.11-.141-.166-.08-.061-.184-.061-.098 0-.184.061-.086.056-.147.166-.056.104-.092.258-.031.153-.031.35t.03.349q.037.153.093.264.061.11.147.165t.184.056q.104 0 .184-.056.086-.055.141-.165.061-.11.092-.264.037-.153.037-.35"/></g>`
		: '';
	const vb = fightProp === 'FIGHT_PROP_GRASS_ADD_HURT' ? '0 0 314 304' : '0 0 14 14';

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" style="width:${size}px;height:${size}px;margin-right:4px;overflow:visible;flex-shrink:0;"><path fill="${color}" d="${iconPath}"/>${secondPath}${pct}</svg>`;
}

export class GenshinCard {
	constructor(characterData, userData, options = {}) {
		this.characterData = characterData;
		this.userData = userData;
		this.options = { statsChart: 'list', ...options };
	}

	async render() {
		const { characterData, userData } = this;
		let template = await fs.readFile(TEMPLATE_PATH, 'utf8');

		const element = ELEMENT_MAP[characterData.element] || ELEMENT_MAP.Anemo;

		const replacements = {
			accent_color: element.accent,
			element_class: element.class,
			element_bg_color: element.bg,
			element_highlight_color: element.highlight,
			character_name: characterData.name,
			player_signature: userData?.nickname ? `▸  ${userData.nickname}` : '',
			uid: userData?.uid || '',
			character_level: characterData.level,
			character_max_level: characterData.level,
			friendship_level: characterData.friendship,
			weapon_name: characterData.weapon?.name || '',
			weapon_refinement: characterData.weapon?.refinement || 1,
			weapon_level: characterData.weapon?.level || 1,
			weapon_max_level: characterData.weapon?.level || 1,
			weapon_substat_1_value: characterData.weapon?.baseAttack || 0,
			weapon_substat_1_icon_path: getSubstatIconPath('FIGHT_PROP_ATTACK'),
			weapon_substat_2_value: characterData.weapon?.specialStats?.[0]?.value || '',
			weapon_substat_2_icon_path: getSubstatIconPath(
				characterData.weapon?.specialStats?.[0]?.fightProp || 'FIGHT_PROP_ATTACK'
			),
			weapon_stars: `<div style="position:relative;z-index:1;text-align:center;color:#ffcc32;-webkit-text-fill-color:#ffcc32;font-size:18px;text-shadow:0 1px 1px #000,0 1px 3px rgba(0,0,0,0.5);">${'★'.repeat(characterData.weapon?.stars || 0)}</div>`,
			weapon_rarity_bg:
				{
					5: 'linear-gradient(135deg, #6b4c1e 0%, #c8903e 50%, #6b4c1e 100%)',
					4: 'linear-gradient(135deg, #3c3068 0%, #8b6cc1 50%, #3c3068 100%)',
					3: 'linear-gradient(135deg, #2a4a6b 0%, #5b8fb5 50%, #2a4a6b 100%)'
				}[characterData.weapon?.stars] || 'linear-gradient(135deg, #2a4a6b 0%, #5b8fb5 50%, #2a4a6b 100%)',
			weapon_rarity_color:
				{ 5: 'rgb(221, 134, 55)', 4: 'rgb(163, 113, 205)', 3: 'rgb(91, 143, 181)' }[characterData.weapon?.stars] ||
				'rgb(91, 143, 181)',

			artifact_set: characterData.artifacts?.[0]?.set || ''
		};

		const stats = characterData.stats || [];
		const statMap = Object.fromEntries(stats.map((s) => [s.key, s]));

		const STAT_ORDER = [
			'maxHealth',
			'attack',
			'defense',
			'elementMastery',
			'critRate',
			'critDamage',
			'chargeEfficiency',
			'matchedElementDamage'
		];
		const STAT_LABELS = {
			maxHealth: 'Max HP',
			attack: 'ATK',
			defense: 'DEF',
			elementMastery: 'Elemental Mastery',
			critRate: 'CRIT Rate',
			critDamage: 'CRIT DMG',
			chargeEfficiency: 'Energy Recharge',
			matchedElementDamage: `${characterData.element} DMG Bonus`
		};
		const ELEMENT_FIGHT_PROP = {
			Pyro: 'FIGHT_PROP_FIRE_ADD_HURT',
			Hydro: 'FIGHT_PROP_WATER_ADD_HURT',
			Electro: 'FIGHT_PROP_ELEC_ADD_HURT',
			Cryo: 'FIGHT_PROP_ICE_ADD_HURT',
			Anemo: 'FIGHT_PROP_WIND_ADD_HURT',
			Geo: 'FIGHT_PROP_ROCK_ADD_HURT',
			Dendro: 'FIGHT_PROP_GRASS_ADD_HURT'
		};
		const STAT_FIGHT_PROPS = {
			maxHealth: 'FIGHT_PROP_HP',
			attack: 'FIGHT_PROP_ATTACK',
			defense: 'FIGHT_PROP_DEFENSE',
			elementMastery: 'FIGHT_PROP_ELEMENT_MASTERY',
			critRate: 'FIGHT_PROP_CRITICAL',
			critDamage: 'FIGHT_PROP_CRITICAL_HURT',
			chargeEfficiency: 'FIGHT_PROP_CHARGE_EFFICIENCY',
			matchedElementDamage: ELEMENT_FIGHT_PROP[characterData.element] || 'FIGHT_PROP_FIRE_ADD_HURT'
		};

		const visibleStats = STAT_ORDER.filter((key) => statMap[key] && statMap[key].rawValue !== 0);

		const statsRowsHtml = visibleStats
			.map((key) => {
				const stat = statMap[key];
				const fightProp = STAT_FIGHT_PROPS[key];
				const isElement = fightProp.includes('_ADD_HURT');
				const iconSize = isElement ? 18 : 14;
				const label = STAT_LABELS[key] || key;
				const value = stat.value || '0';
				const hasBreakdown = ['maxHealth', 'attack', 'defense'].includes(key) && stat.baseValue;
				const breakdown = hasBreakdown
					? `<div style="display:flex;justify-content:flex-end;font-size:10px;line-height:11px;color:rgba(255,255,255,0.7);"><span>${stat.baseValue.toLocaleString('en-US')}</span><span style="color:${element.highlight};-webkit-text-fill-color:${element.highlight};margin-left:4px;">+${stat.additionalValue.toLocaleString('en-US')}</span></div>`
					: '';

				if (hasBreakdown) {
					return `<div style="display:flex;align-items:center;font-family:ShinShin,sans-serif;font-size:13.81px;color:#fff;white-space:nowrap;padding:2px 0;width:303px;">
				${statIconSvg(fightProp, iconSize)}
				<span>${label}</span>
				<span style="flex-grow:1;"></span>
				<div style="display:flex;flex-direction:column;align-items:flex-end;">
					<span style="line-height:16px;">${value}</span>
					${breakdown}
				</div>
			</div>`;
				}

				return `<div style="display:flex;align-items:center;flex-grow:0;font-family:ShinShin,sans-serif;font-size:13.81px;line-height:21px;color:#fff;white-space:nowrap;padding:4px 0;width:303px;">
			${statIconSvg(fightProp, iconSize)}
			<span style="flex-grow:0;">${label}</span>
			<span style="flex-grow:1;"></span>
			<span style="flex-grow:0;">${value}</span>
		</div>`;
			})
			.join('\n');

		replacements.stats_rows =
			this.options.statsChart === 'radar'
				? `<img src="${renderRadarChart(statMap, element.highlight)}" width="300" height="300" style="display:block;margin:0 auto;" />`
				: statsRowsHtml;
		replacements.stat_hp_base = (statMap.maxHealth?.baseValue || 0).toLocaleString('en-US');
		replacements.stat_hp_bonus = statMap.maxHealth?.additionalValue
			? `+${statMap.maxHealth.additionalValue.toLocaleString('en-US')}`
			: '+0';

		for (let i = 0; i < 3; i++) {
			const skill = characterData.skills?.[i];

			replacements[`talent_${i + 1}_level`] = skill?.level || 0;
		}

		for (let i = 0; i < 6; i++) {
			const constellation = characterData.constellations?.[i];

			replacements[`constellation_${i + 1}_locked`] = constellation?.unlocked ? '' : 'locked';
			replacements[`constellation_${i + 1}_opacity`] = constellation?.unlocked ? '1' : '0.3';
			replacements[`constellation_${i + 1}_spikes_opacity`] = constellation?.unlocked ? '1' : '0.2';
		}

		for (let i = 0; i < 5; i++) {
			const artifact = characterData.artifacts?.[i];

			replacements[`artifact_${i + 1}_opacity`] = artifact ? '1' : '0';

			const stars = artifact ? '★'.repeat(artifact.stars) : '';
			const level = artifact ? `+${artifact.level}` : '';
			const mainValue = artifact?.mainstat?.value || '';
			const mainIcon = artifact ? statIconSvg(artifact.mainstat.fightProp, 15) : '';

			replacements[`artifact_${i + 1}_main_section`] = artifact
				? `<div style="display:flex;flex-direction:column;align-items:flex-end;justify-content:flex-end;width:101px;height:100%;font-family:ShinShin,sans-serif;color:#fff;text-align:right;padding:0px 6px 4px 6px;box-sizing:border-box;position:absolute;left:10px;top:0;z-index:2;gap:0px;">
			<div>${mainIcon}</div>
			<div style="font-size:18px;font-weight:bold;text-shadow:0 1px 2px rgba(0,0,0,0.8);margin-top:-4px;">${mainValue}</div>
			<div style="display:flex;align-items:center;gap:3px;font-size:16px;margin-top:-4px;"><span style="color:#ffd700;-webkit-text-fill-color:#ffd700;">${stars}</span><span style="background:rgba(255,255,255,0.15);border-radius:2px;padding:0px 4px 0px 3px;font-size:10px;line-height:12px;">${level}</span></div>
		</div>`
				: '';
			replacements[`artifact_${i + 1}_level`] = level;
			replacements[`artifact_${i + 1}_main_stat_value`] = mainValue;
			replacements[`artifact_${i + 1}_main_stat_icon_path`] = artifact
				? getSubstatIconPath(artifact.mainstat.fightProp.replace('_PERCENT', ''))
				: '';

			const subsHtml = (artifact?.substats || [])
				.map((sub) => {
					return `<div style="display:flex;align-items:center;font-family:ShinShin,sans-serif;font-size:14.5px;line-height:18px;color:#fff;white-space:nowrap;width:calc(50% - 6px);box-sizing:border-box;padding:3px 0;">
				${statIconSvg(sub.fightProp, 16)}
				<span>+${sub.value}</span>
			</div>`;
				})
				.join('\n');

			replacements[`artifact_${i + 1}_substats`] =
				`<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-start;padding:9px 8px 6px 8px;width:100%;box-sizing:border-box;gap:8px 12px;">${subsHtml}</div>`;

			for (let j = 0; j < 4; j++) {
				const sub = artifact?.substats?.[j];

				replacements[`artifact_${i + 1}_sub_${j + 1}_value`] = sub ? `+${sub.value}` : '';
				replacements[`artifact_${i + 1}_sub_${j + 1}_icon_path`] = sub ? getSubstatIconPath(sub.fightProp) : '';
			}
		}

		const imageUrls = {
			character_splash_image: characterData.assets?.splash,
			character_namecard_image: characterData.assets?.nameCard,
			weapon_image: characterData.weapon?.icon
		};

		for (let i = 0; i < 3; i++) {
			imageUrls[`talent_${i + 1}_image`] = characterData.skills?.[i]?.icon;
		}

		for (let i = 0; i < 6; i++) {
			imageUrls[`constellation_${i + 1}_image`] = characterData.constellations?.[i]?.icon;
		}

		for (let i = 0; i < 5; i++) {
			imageUrls[`artifact_${i + 1}_image`] = characterData.artifacts?.[i]?.icon;
		}

		const imageEntries = Object.entries(imageUrls);
		const base64Results = await Promise.all(imageEntries.map(([, url]) => toBase64(url)));

		for (let i = 0; i < imageEntries.length; i++) {
			replacements[imageEntries[i][0]] = base64Results[i];
		}

		for (const [key, value] of Object.entries(replacements)) {
			template = template.replaceAll(`{{${key}}}`, String(value));
		}

		return {
			svg: template,
			async toBuffer() {
				const puppeteer = await import('puppeteer');
				const browser = await puppeteer.default.launch({ headless: true, args: ['--no-sandbox'] });
				const page = await browser.newPage();

				await page.setViewport({ width: 1120, height: 467 });
				await page.setContent(
					`<!DOCTYPE html><html><body style="margin:0;padding:0;background:transparent;">${template}</body></html>`,
					{ waitUntil: 'networkidle0' }
				);
				const buffer = await page.screenshot({ type: 'png', omitBackground: true });

				await browser.close();
				return buffer;
			},
			async toFile(filePath) {
				if (filePath.endsWith('.svg')) {
					await fs.writeFile(filePath, template, 'utf8');
				} else {
					const buffer = await this.toBuffer();

					await fs.writeFile(filePath, buffer);
				}
			}
		};
	}
}

export async function renderGenshinCard(characterData, userData, options = {}) {
	return new GenshinCard(characterData, userData, options).render();
}
