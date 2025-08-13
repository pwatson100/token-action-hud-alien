import { GROUP } from './constants.js';

/**
 * Default layout and groups
 */
export let DEFAULTS = null;

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
	const groups = GROUP;
	Object.values(groups).forEach((group) => {
		group.name = coreModule.api.Utils.i18n(group.name);
		group.listName = `Group: ${coreModule.api.Utils.i18n(group.listName ?? group.name)}`;
	});
	const groupsArray = Object.values(groups);
	DEFAULTS = {
		layout: [
			{
				nestId: 'attributes',
				id: 'attributes',
				name: coreModule.api.Utils.i18n('ALIENRPG.Attributes'),
				groups: [{ ...groups.attributes, nestId: 'attributes_attributes' }],
			},
			{
				nestId: 'inventory',
				id: 'inventory',
				name: coreModule.api.Utils.i18n('ALIENRPG.Inventory'),
				groups: [
					{ ...groups.weapons, nestId: 'inventory_weapons' },
					{ ...groups.armor, nestId: 'inventory_armor' },
					{ ...groups.item, nestId: 'inventory_item' },
				],
			},
			{
				nestId: 'armaments',
				id: 'armaments',
				name: coreModule.api.Utils.i18n('ALIENRPG.ARMAMENTS'),
				groups: [
					{ ...groups.offensive, nestId: 'armaments_offensive' },
					{ ...groups.defensive, nestId: 'armaments_defensive' },
				],
			},
			{
				nestId: 'skills',
				id: 'skills',
				name: coreModule.api.Utils.i18n('ALIENRPG.Skills'),
				groups: [{ ...groups.skills, nestId: 'skills_skills' }],
			},
			{
				nestId: 'conditions',
				id: 'conditions',
				name: coreModule.api.Utils.i18n('ALIENRPG.Conditions'),
				groups: [{ ...groups.conditions, nestId: 'conditions_conditions' }],
			},
			{
				nestId: 'talents',
				id: 'talents',
				name: coreModule.api.Utils.i18n('ALIENRPG.Talents') + '/' + coreModule.api.Utils.i18n('ALIENRPG.AgendaStory'),
				groups: [
					{ ...groups.talents, nestId: 'talents_talents' },
					{ ...groups.agenda, nestId: 'talents_agenda' },
				],
			},
			{
				nestId: 'attackroll',
				id: 'attackroll',
				name: coreModule.api.Utils.i18n('ALIENRPG.AttackRoll'),
				groups: [{ ...groups.attackroll, nestId: 'attackroll_attackroll' }],
			},
			{
				nestId: 'defence',
				id: 'defence',
				name: coreModule.api.Utils.i18n('ALIENRPG.Defensive'),
				groups: [{ ...groups.defence, nestId: 'defence_defence' }],
			},
			{
				nestId: 'utility',
				id: 'utility',
				name: coreModule.api.Utils.i18n('ALIENRPG.Utility'),
				groups: [
					{ ...groups.utility, nestId: 'utility_fastslow' },
					{ ...groups.health, nestId: 'utility_health' },
					{ ...groups.criticalinjury, nestId: 'utility_criticalinjury' },
				],
			},
		],
		groups: groupsArray,
	};
});
