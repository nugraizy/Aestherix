const ENKA_BASE_URL = 'https://enka.network';
const ASSETS_PATH = '/ui';

const STAT_KEYS = [
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
	matchedElementDamage: 'DMG Bonus'
};

function formatStatValue(stat) {
	if (!stat) {
		return '0';
	}

	if (stat.isPercent) {
		return `${(stat.value * 100).toFixed(1)}%`;
	}

	return Math.round(stat.value).toLocaleString('en-US');
}

function extractUrl(imageObj) {
	if (!imageObj?.name) {
		return null;
	}

	return `${ENKA_BASE_URL}${ASSETS_PATH}/${imageObj.name}.png`;
}

function parseWeapon(weapon) {
	if (!weapon) {
		return null;
	}

	const weaponStats = Object.values(weapon.weaponStats || {});
	const baseAttack = weaponStats.find((s) => s.fightProp === 'FIGHT_PROP_BASE_ATTACK');
	const specialStats = weaponStats.filter((s) => s.fightProp !== 'FIGHT_PROP_BASE_ATTACK' && s.value > 0);

	return {
		name: weapon.weaponData?.name?.text || 'Unknown',
		icon: weapon.isAwaken ? extractUrl(weapon.weaponData?.awakenIcon) : extractUrl(weapon.weaponData?.icon),
		stars: weapon.weaponData?.stars || 0,
		level: weapon.level,
		refinement: weapon.refinementRank,
		baseAttack: baseAttack ? Math.round(baseAttack.value) : 0,
		specialStats: specialStats.map((s) => ({
			fightProp: s.fightProp,
			name: s.fightPropName?.text || s.fightProp,
			value: formatStatValue(s)
		}))
	};
}

function parseArtifact(artifact) {
	if (!artifact) {
		return null;
	}

	const substats = Object.values(artifact.substats?.total || {});

	return {
		name: artifact.artifactData?.name?.text || 'Unknown',
		icon: extractUrl(artifact.artifactData?.icon),
		set: artifact.artifactData?.set?.name?.text || 'Unknown',
		stars: artifact.artifactData?.stars || 0,
		level: artifact.level - 1,
		type: artifact.artifactData?.equipType,
		typeName: artifact.artifactData?.equipTypeName?.text || 'Unknown',
		mainstat: {
			fightProp: artifact.mainstat?.fightProp,
			name: artifact.mainstat?.fightPropName?.text || 'Unknown',
			value: formatStatValue(artifact.mainstat)
		},
		substats: substats.map((s) => ({
			fightProp: s.fightProp,
			name: s.fightPropName?.text || s.fightProp,
			value: formatStatValue(s)
		}))
	};
}

function parseStats(stats) {
	if (!stats) {
		return [];
	}

	const baseAdditionalMap = {
		maxHealth: { base: 'healthBase', percent: 'healthPercent', flat: 'healthFlat' },
		attack: { base: 'attackBase', percent: 'attackPercent', flat: 'attackFlat' },
		defense: { base: 'defenseBase', percent: 'defensePercent', flat: 'defenseFlat' }
	};

	return STAT_KEYS.map((key) => {
		const stat = stats[key];

		if (!stat) {
			return null;
		}

		const result = {
			key,
			label: STAT_LABELS[key] || stat.fightPropName?.text || key,
			value: formatStatValue(stat),
			rawValue: stat.value || 0,
			isPercent: stat.isPercent || false
		};

		const mapping = baseAdditionalMap[key];

		if (mapping) {
			const base = stats[mapping.base]?.value || 0;
			const percent = stats[mapping.percent]?.value || 0;
			const flat = stats[mapping.flat]?.value || 0;
			const additional = Math.round(base * percent + flat);

			result.baseValue = Math.round(base);
			result.additionalValue = additional;
		}

		return result;
	}).filter(Boolean);
}

function parseConstellations(characterData, unlockedConstellations) {
	const allConstellations = Object.values(characterData?.constellations || {});
	const unlockedIds = Object.values(unlockedConstellations || {}).map((c) => c.id);

	return allConstellations.map((c) => ({
		name: c.name?.text || 'Unknown',
		icon: extractUrl(c.icon),
		unlocked: unlockedIds.includes(c.id)
	}));
}

function parseSkillLevels(skillLevels) {
	return Object.values(skillLevels || {}).map((entry) => ({
		name: entry.skill?.name?.text || 'Unknown',
		icon: extractUrl(entry.skill?.icon),
		level: entry.level?.value || 0
	}));
}

function parseCharacter(raw) {
	const { characterData } = raw;

	return {
		name: characterData?.name?.text || 'Unknown',
		element: characterData?.element?.name?.text || 'Unknown',
		stars: characterData?.stars || 0,
		level: raw.level,
		ascension: raw.ascension,
		friendship: raw.friendship,
		constellationCount: Object.keys(raw.unlockedConstellations || {}).length,
		assets: {
			splash: extractUrl(characterData?.splashImage),
			icon: extractUrl(characterData?.icon),
			sideIcon: extractUrl(characterData?.sideIcon),
			nameCard: extractUrl(characterData?.nameCard?.pictures?.['1'])
		},
		weapon: parseWeapon(raw.weapon),
		artifacts: Object.values(raw.artifacts || {})
			.map(parseArtifact)
			.filter(Boolean),
		stats: parseStats(raw.stats),
		constellations: parseConstellations(characterData, raw.unlockedConstellations),
		skills: parseSkillLevels(raw.skillLevels)
	};
}

export function parseGenshinUser(rawData) {
	return {
		uid: rawData.uid,
		nickname: rawData.nickname,
		signature: rawData.signature || null,
		profilePicture: extractUrl(rawData.profilePicture?.costume?.icon),
		level: rawData.level,
		worldLevel: rawData.worldLevel,
		achievements: rawData.achievements,
		maxFriendshipCount: rawData.maxFriendshipCount || 0,
		spiralAbyss: rawData.spiralAbyss || null,
		stygian: rawData.stygian || null
	};
}

export function parseCharactersData(rawData) {
	const characters = Object.values(rawData || {});

	return characters.map(parseCharacter);
}

export { ASSETS_PATH, ENKA_BASE_URL };
