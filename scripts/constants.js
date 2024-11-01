/**
 * Module-based constants
 */
export const MODULE = {
	ID: 'token-action-hud-alien',
};

/**
 * Core module
 */
export const CORE_MODULE = {
	ID: 'token-action-hud-core',
};

/**
 * Core module version required by the system module
 */
export const REQUIRED_CORE_MODULE_VERSION = '2.0.4';

/**
 * Action types
 */
export const ACTION_TYPE = {
	attributes: 'ALIENRPG.Attributes',
	skill: 'ALIENRPG.Skill',
	talents: 'ALIENRPG.Talents',
	health: 'ALIENRPG.Health',
	stress: 'ALIENRPG.Stress',
	defence: 'ALIENRPG.Defensive',
	attackroll: 'ALIENRPG.AttackRoll',
	conditions: 'ALIENRPG.Conditions',
	utility: 'tokenActionHud.utility',
};

/**
 * Groups
 */
export const GROUP = {
	attributes: { id: 'attributes', name: 'ALIENRPG.Attributes', type: 'system' },
	skills: { id: 'skills', name: 'ALIENRPG.Skills', type: 'system' },
	armor: { id: 'armor', name: 'ALIENRPG.Armor', type: 'system' },
	item: { id: 'item', name: 'ALIENRPG.Items', type: 'system' },
	weapons: { id: 'weapons', name: 'ALIENRPG.Weapons', type: 'system' },
	conditions: { id: 'conditions', name: 'ALIENRPG.Conditions', type: 'system' },
	talents: { id: 'talents', name: 'ALIENRPG.Talents', type: 'system' },
	attackroll: { id: 'attackroll', name: 'ALIENRPG.AttackRoll', type: 'system' },
	health: { id: 'health', name: 'ALIENRPG.Health', type: 'system' },
	stress: { id: 'stress', name: 'ALIENRPG.Stress', type: 'system' },
	defence: { id: 'defence', name: 'ALIENRPG.Defensive', type: 'system' },
	agenda: { id: 'agenda', name: 'ITEM.TypeAgenda', type: 'system' },
	criticalinjury: { id: 'criticalinjury', name: 'ALIENRPG.RollCrit', type: 'system' },
	armaments: { id: 'armaments', name: 'ALIENRPG.ARMAMENTS', type: 'system' },
	offensive: { id: 'offensive', name: 'ALIENRPG.Offensive', type: 'system' },
	defensive: { id: 'defensive', name: 'ALIENRPG.Defensive', type: 'system' },
	utility: { id: 'utility', name: 'tokenActionHud.utility', type: 'system' },
};

/**
 * Item types
 */
export const ITEM_TYPE = {
	armor: { groupId: 'armor' },
	weapon: { groupId: 'weapons' },
	talent: { groupId: 'talents' },
	agenda: { groupId: 'agenda' },
	conditions: { groupId: 'conditions' },
	health: { groupId: 'health' },
	stress: { groupId: 'stress' },
	defence: { groupId: 'defence' },
	attackroll: { groupId: 'attackroll' },
	item: { groupId: 'item' },
	offensive: { groupId: 'offensive' },
	defensive: { groupId: 'defensive' },
};

/**
 * Conditions
 */
export const CONDITION = {
	panicked: {
		description: `ALIENRPG.TAHPANICTIP`,
	},
	starving: {
		description: `ALIENRPG.TAH.starving`,
	},
	freezing: {
		description: `ALIENRPG.TAH.freezing`,
	},
	dehydrated: {
		description: `ALIENRPG.TAH.dehydrated`,
	},
	exhausted: {
		description: `ALIENRPG.TAH.exhausted`,
	},
	encumbered: {
		description: `ALIENRPG.TAH.encumbered`,
	},
	overwatch: {
		description: `ALIENRPG.TAH.overwatch`,
	},
	radiation: {
		description: `ALIENRPG.TAH.radiation`,
	},
};
