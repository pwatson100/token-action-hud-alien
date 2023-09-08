/**
 * Module-based constants
 */
export const MODULE = {
	ID: "token-action-hud-alien",
};

/**
 * Core module
 */
export const CORE_MODULE = {
	ID: "token-action-hud-core",
};

/**
 * Core module version required by the system module
 */
export const REQUIRED_CORE_MODULE_VERSION = "1.4";

/**
 * Action types
 */
export const ACTION_TYPE = {
	attributes: "ALIENRPG.Attributes",
	skill: "ALIENRPG.Skill",
	talents: "ALIENRPG.Talents",
	health: "ALIENRPG.Health",
	stress: "ALIENRPG.Stress",
	defence: "ALIENRPG.Defensive",
	attackroll: "ALIENRPG.AttackRoll",
	conditions: "ALIENRPG.Conditions",
	utility: "tokenActionHud.utility",
};

/**
 * Groups
 */
export const GROUP = {
	attributes: { id: "attributes", name: "ALIENRPG.Attributes", type: "system" },
	skills: { id: "skills", name: "ALIENRPG.Skills", type: "system" },
	armor: { id: "armor", name: "ALIENRPG.Armor", type: "system" },
	item: { id: "item", name: "ALIENRPG.Items", type: "system" },
	weapons: { id: "weapons", name: "ALIENRPG.Weapons", type: "system" },
	conditions: { id: "conditions", name: "ALIENRPG.Conditions", type: "system" },
	talents: { id: "talents", name: "ALIENRPG.Talents", type: "system" },
	attackroll: { id: "attackroll", name: "ALIENRPG.AttackRoll", type: "system" },
	health: { id: "health", name: "ALIENRPG.Health", type: "system" },
	stress: { id: "stress", name: "ALIENRPG.Stress", type: "system" },
	defence: { id: "defence", name: "ALIENRPG.Defensive", type: "system" },
	agenda: { id: "agenda", name: "ITEM.TypeAgenda", type: "system" },
	criticalinjury: { id: "criticalinjury", name: "ALIENRPG.RollCrit", type: "system" },
	armaments: { id: "armaments", name: "ALIENRPG.ARMAMENTS", type: "system" },
	offensive: { id: "offensive", name: "ALIENRPG.Offensive", type: "system" },
	defensive: { id: "defensive", name: "ALIENRPG.Defensive", type: "system" },
	utility: { id: "utility", name: "tokenActionHud.utility", type: "system" },
};

/**
 * Item types
 */
export const ITEM_TYPE = {
	armor: { groupId: "armor" },
	weapon: { groupId: "weapons" },
	talent: { groupId: "talents" },
	agenda: { groupId: "agenda" },
	conditions: { groupId: "conditions" },
	health: { groupId: "health" },
	stress: { groupId: "stress" },
	defence: { groupId: "defence" },
	attackroll: { groupId: "attackroll" },
	item: { groupId: "item" },
	offensive: { groupId: "offensive" },
	defensive: { groupId: "defensive" },
};

/**
 * Conditions
 */
export const CONDITION = {
	starving: {
		description: `After a day without sufficient food, you become Starving. <br>Being Starving has several effects: <br>
        <ul>
        <li>You cannot recover Health or relieve Stress.</li>
        <li>Every day, you need to make a <strong>STAMINA</strong> roll. If you fail, you suffer one point of damage and your <strong>STRESS LEVEL</strong> increases one step. If you are Broken while Starving, you need to make a Death Roll every day. <strong> MEDICAL AID</strong> has no effect against these Death Rolls, you can only be saved by ingesting some form of sustenance.</li>
        <li>As soon as you have eaten, the above effects wear off within one Shift.</li>`,
	},
	freezing: {
		description: `In an environment without enough clothes or shelter, you become Freezing. Being Freezing has several effects: <br>
        <ul>
        <li>You cannot recover Health or relieve Stress.</li>
        <li>You need to make STAMINA rolls at regular intervals. The colder it is, the more frequently you need to roll. If above freezing, once per day is enough. In sub-zero temperatures, roll once per Shift, and in the deep cold of space, you need to roll every Turn. If you fail, you suffer one point of damage and your Stress Level increases one step. If you are Broken while Freezing, you must make a Death Roll the next time you would need to roll for the cold.</li>
        <li>As soon as you get warm, you stop rolling for STAMINA and can recover Health and relieve Stress normally.</li>
        </ul>`,
	},
	dehydrated: {
		description:
			"After a day without sufficient water, you become Dehydrated. Being Dehydrated has several effects:<br>You cannot recover Health or relieve Stress.Every Shift, you suffer one point of damage and your STRESS LEVEL increases one step. If you are Broken while Dehydrated, you must make a Death Roll after every Shift without liquid.  MEDICAL AID has no effect against these Death Rolls, you need fluids to save yourself.As soon as you drink, the above effects wear off within one Shift.",
	},
	exhausted: {
		description: `You need to sleep for at least one Shift each day. After one day without sufficient sleep, you become Exhausted. <br>Being Exhausted has several effects: <br>
        <ul>
        <li>You cannot relieve Stress.</li>
        <li>You must make a <strong>STAMINA</strong> roll each day (the GM decides when), with a negative modification equal to the number of days spent without decent sleep. If the roll fails, you collapse and sleep for one Shift.</li>
        <li>As soon as you have slept for at least one Shift, you are no longer Exhausted.</li>
        </ul>`,
	},
	encumbered: {
		description: `<p>You can carry a number of regular-sized items equal to double your <strong>STRENGTH</strong> rating without problems. A regular item is generally the size of a small bag and weighs no more than a few kilos. <br><br><strong style="color: deepskyblue;">HEAVY &amp; LIGHT ITEMS:</strong> An item designated as <em>heavy</em> counts as two regular items, and typically takes up two rows on your character sheet. Some heavy items count as three or even four normal items&mdash;the gear lists in Gear sections indicate this. <br>At the opposite end of the spectrum, there are items that are designated as <em>light</em> &mdash; they count as half of a regular item, and so you can list two light items on one row on your sheet. Some light items count as a quarter of a normal item in terms of encumbrance &mdash; the weight of such items is written as &frac14; in the gear lists. <br><br><strong style="color: deepskyblue;">TINY ITEMS:</strong> Items that are even smaller than light items are called <em>tiny</em>. They are so small they don&rsquo;t affect your encumbrance at all. The rule of thumb is: if the item can be hidden in a closed fist, it&rsquo;s tiny. Tiny items also need to be listed on your character sheet. <br><br><strong style="color: deepskyblue;">OVER-ENCUMBERED:</strong> You can temporarily carry up to twice your normal encumbrance limit, i.e. <strong>STRENGTH</strong> x 4 items. If over-encumbered, you must make a <strong>MOBILITY</strong> roll when you want to run or crawl in a Round of combat ACTIONS &amp; INITIATIVE</a>). If you fail, you must either drop what you are carrying, or stay put.</p>`,
	},
	overwatch: {
		description: `As a fast action, you can assume an overwatch position in a specified direction, as long as you have a ranged weapon and no enemies within <strong>ENGAGED</strong> range. This means that you aim in the specified direction and are ready to shoot. Between the time you assume the overwatch position and your time to act in the next Round, you can fire your weapon against a target in the chosen direction. <br><br>You can fire whenever you want in the turn order, and your shot is resolved before all other actions &mdash; even if they are already declared. <br>For example, if an enemy in the direction you are aiming declares that they want to fire a weapon, you can shoot first. The enemy is not allowed to change their attack after your overwatch attack. <br>Firing when in overwatch position counts as a normal attack (a slow action). Therefore, you must save your slow action in the Round for any overwatch attack you want to make. If both you and an enemy assume overwatch positions against each other, and both choose to fire against each other, then an opposed <strong>RANGED COMBAT</strong> roll determines which attack goes first. This roll does not count as an action for either of you. <br><br><strong style="color: deepskyblue;">LOSING OVERWATCH:</strong> You keep your overwatch position as long as you do nothing but shoot in the chosen direction. <br>If you perform any other action, the overwatch position is lost. It is also immediately lost if either of the following occurs:
        <ul>
        <li>You are attacked in close combat.</li>
        <li>You suffer damage.</li>
        </ul>`,
	},
	radiation: {
		description: `<strong style="color: deepskyblue;">EFFECTS:</strong> Every time you gain a Radiation Point, you must roll a number of dice equal to your total current number of accumulated Rads. For every&nbsp;<span class="basesymbol">&nbsp;</span>&nbsp;in the roll, you take one point of damage. If you are Broken by radiation damage, you must make a Death Roll each time you get another Rad, until you are removed from the radiation hotspot. As long as you remain inside a hotspot, you cannot recover Health in any way. <br><br><strong style="color: deepskyblue;">RECOVERY:</strong> After you leave the irradiated area, you heal one Rad per Shift. <br><br><strong style="color: deepskyblue;">PERMANENT RADIATION:</strong> There is a risk that the radiation will permanently stay in your body. Every time you are about to heal a Rad, roll a Stress Die. <br>If it shows a facehugger the Rad is not healed but instead becomes permanent. <br>Permanent radiation can never be healed.`,
	},
};
