// System Module Imports
import { ACTION_TYPE, ITEM_TYPE, CONDITION } from './constants.js';
import { Utils } from './utils.js';

export let ActionHandler = null;

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
	/**
	 * Extends Token Action HUD Core's ActionHandler class and builds system-defined actions for the HUD
	 */
	ActionHandler = class ActionHandler extends coreModule.api.ActionHandler {
		// Initialize actor and token variables
		actors = null;
		tokens = null;
		actorType = null;

		// Initialize items variable
		items = null;

		// Initialize setting variables
		showUnequippedItems = null;
		showtooltip = null;

		/**
		 * Build system actions
		 * Called by Token Action HUD Core
		 * @override
		 * @param {array} groupIds
		 */
		async buildSystemActions(groupIds) {
			// Set actor and token variables
			this.actors = !this.actor ? this.#getActors() : [this.actor];
			this.tokens = !this.token ? this.#getTokens() : [this.token];
			this.actorType = this.actor?.type;

			// Settings
			this.displayUnequipped = Utils.getSetting('displayUnequipped');
			this.showtooltip = Utils.getSetting('showtooltip');

			// Set items variable
			if (this.actor) {
				let items = this.actor.items;
				items = coreModule.api.Utils.sortItemsByName(items);
				this.items = items;
			}

			switch (this.actorType) {
				case 'character':
					{
						await this.#buildCharacterActions();
					}
					break;
				case 'synthetic':
					{
						await this.#buildSyntheticActions(this.actor);
					}
					break;
				case 'creature':
					{
						this.inventorygroupIds = ['attributes', 'attack'];
						await this.#buildCreatureActions();
					}
					break;
				case 'vehicles':
					this.#buildVehicleActions();
					break;
				case 'spacecraft':
					this.#buildSpacecraftActions();
					this.#buildMinorCrit();
					this.#buildMajorCrit();
					return;
				default:
					{
						await this.#buildMultipleTokenActions();
					}
					break;
			}
		}

		/**
		 * Build character actions
		 * @private
		 */
		async #buildCharacterActions() {
			await Promise.all([
				this.#buildAttributes(),
				this.#buildSkills(),
				this.#buildTalents(),
				this.#buildAgenda(),
				this.#buildConditions(),
				this.#buildInventory(),
				this.#buildHealth(),
				this.#buildStress(),
				this.#buildCrit(),
				this.#buildStatusEffects(),
			]);
		}
		async #buildSyntheticActions(actor) {
			// debugger;
			if (actor.system.header.synthstress) {
				await Promise.all([
					this.#buildAttributes(),
					this.#buildSkills(),
					this.#buildTalents(),
					this.#buildAgenda(),
					this.#buildConditions(),
					this.#buildInventory(),
					this.#buildHealth(),
					this.#buildCrit(),
				]);
			} else {
				await Promise.all([
					this.#buildAttributes(),
					this.#buildSkills(),
					this.#buildTalents(),
					this.#buildAgenda(),
					this.#buildSynthConditions(),
					this.#buildInventory(),
					this.#buildHealth(),
					this.#buildCrit(),
				]);
			}
		}

		async #buildCreatureActions() {
			await Promise.all([this.#buildCreatureAttributes(), this.#buildCreatureDefence(), this.#buildHealth(), this.#buildCreatureAttack(), this.#buildCrit()]);
		}

		async #buildVehicleActions() {
			await Promise.all([this.#buildVehicleAttributes(), this.#buildVehicleInventory(), this.#buildHull()]);
		}
		async #buildSpacecraftActions() {
			await Promise.all([this.#buildSpacecraftAttributes(), this.#buildSpacecraftArmaments(), this.#buildSpacecraftDamage()]);
		}

		async #buildMultipleTokenActions() {}

		async #buildInventory() {
			if (this.items.size === 0) return;

			const actionTypeId = 'item';
			const inventoryMap = new Map();

			for (const [itemId, itemData] of this.items) {
				const type = itemData.type;

				if (type === 'weapon' || type === 'armor' || type === 'item') {
					const equipped = itemData.system.header.active;

					if (equipped === true || this.displayUnequipped) {
						const typeMap = inventoryMap.get(type) ?? new Map();
						typeMap.set(itemId, itemData);
						inventoryMap.set(type, typeMap);
					}
				} else {
					continue;
				}
			}

			for (const [type, typeMap] of inventoryMap) {
				const groupId = ITEM_TYPE[type]?.groupId;

				if (!groupId) continue;

				const groupData = { id: groupId, type: 'system' };

				// Get actions
				const actions = [...typeMap].map(([itemId, itemData]) => {
					let name = '';
					const id = itemId;
					const img = coreModule.api.Utils.getImage(itemData);
					if (itemData.type === 'armor') {
						name = itemData.name + ' ' + '-' + ' ' + itemData.system.attributes.armorrating.value;
					} else {
						name = itemData.name;
					}
					const actionTypeName = coreModule.api.Utils.i18n(ACTION_TYPE[actionTypeId]);
					const listName = `${actionTypeName ? `${actionTypeName}: ` : ''}${name}`;
					const encodedValue = [actionTypeId, id].join(this.delimiter);
					const tooltip = coreModule.api.Utils.i18n('ALIENRPG.LEFTCLICKTOROLL');

					return {
						id,
						name,
						img,
						listName,
						encodedValue,
						tooltip,
					};
				});

				// TAH Core method to add actions to the action list
				this.addActions(actions, groupData);
			}
		}
		async #buildVehicleInventory() {
			if (this.items.size === 0) return;

			const actionTypeId = 'item';
			const inventoryMap = new Map();

			for (const [itemId, itemData] of this.items) {
				const type = itemData.type;

				const typeMap = inventoryMap.get(type) ?? new Map();
				typeMap.set(itemId, itemData);
				inventoryMap.set(type, typeMap);
			}

			for (const [type, typeMap] of inventoryMap) {
				const groupId = ITEM_TYPE[type]?.groupId;

				if (!groupId) continue;

				const groupData = { id: groupId, type: 'system' };

				// Get actions
				const actions = [...typeMap].map(([itemId, itemData]) => {
					let name = '';
					const id = itemId;
					const img = coreModule.api.Utils.getImage(itemData);
					if (itemData.type === 'armor') {
						name = itemData.name + ' ' + '-' + ' ' + itemData.system.attributes.armorrating.value;
					} else {
						name = itemData.name;
					}
					const actionTypeName = coreModule.api.Utils.i18n(ACTION_TYPE[actionTypeId]);
					const listName = `${actionTypeName ? `${actionTypeName}: ` : ''}${name}`;
					const encodedValue = [actionTypeId, id].join(this.delimiter);
					const tooltip = coreModule.api.Utils.i18n('ALIENRPG.LEFTCLICKTOROLL');

					return {
						id,
						name,
						img,
						listName,
						encodedValue,
						tooltip,
					};
				});

				// TAH Core method to add actions to the action list
				this.addActions(actions, groupData);
			}
		}

		async #buildSpacecraftArmaments() {
			let type = '';
			if (this.items.size === 0) return;

			const actionTypeId = 'armaments';
			const inventoryMap = new Map();

			for (const [itemId, itemData] of this.items) {
				const atype = itemData.system.header.type.value;
				switch (atype) {
					case '1':
						type = 'offensive';
						break;
					case '2':
						type = 'defensive';
						break;
					default:
						type = 'shipitem';

						break;
				}

				const typeMap = inventoryMap.get(type) ?? new Map();
				typeMap.set(itemId, itemData);
				inventoryMap.set(type, typeMap);
			}

			for (const [type, typeMap] of inventoryMap) {
				const groupId = ITEM_TYPE[type]?.groupId;

				if (!groupId) continue;

				const groupData = { id: groupId, type: 'system' };
				// Get actions
				const actions = [...typeMap].map(([itemId, itemData]) => {
					const id = itemId;
					const img = coreModule.api.Utils.getImage(itemData);
					const name = itemData.name;
					const actionTypeName = coreModule.api.Utils.i18n(ACTION_TYPE[actionTypeId]);
					const listName = `${actionTypeName ? `${actionTypeName}: ` : ''}${name}`;
					const encodedValue = [actionTypeId, id].join(this.delimiter);
					const tooltip = coreModule.api.Utils.i18n('ALIENRPG.LEFTCLICKTOROLL');

					return {
						id,
						name,
						img,
						listName,
						encodedValue,
						tooltip,
					};
				});

				// TAH Core method to add actions to the action list
				this.addActions(actions, groupData);
			}
		}

		async #buildConditions() {
			if (this.tokens?.length === 0) return;
			let myActor = this.actor;
			// let id = '';
			// let rightClick = false;
			const actionType = 'conditions';

			// Get conditions
			const conditions = game.alienrpg.config.conditionEffects.filter(
				(condition) => condition.id !== '' && condition.id !== 'shipminor' && condition.id !== 'shipmajor' && condition.id !== 'criticalinj'
			);

			// Exit if no conditions exist
			if (conditions.length === 0) return;
			let newActions = [];
			// Get actions
			const actions = await Promise.all(
				conditions.map(async (condition) => {
					let id = condition.id;
					const actionTypeName = `${coreModule.api.Utils.i18n(ACTION_TYPE[actionType])}: ` ?? '';
					const tooltipData = await this.#getConditionTooltipData(id, name);
					const active = this.actors.every((actor) => {
						return actor.effects.some((effect) => effect.statuses.some((status) => status === id) && !effect?.disabled);
					})
						? ' active'
						: '';
					const rightClick = this.isRightClick;
					newActions.push({
						id: id,
						name: coreModule.api.Utils.i18n(condition.label) ?? condition.name,
						listName: `${actionTypeName}${name}`,
						tooltip: await this.#getTooltip(await this.#getConditionTooltipData(id, condition.name)),
						img: coreModule.api.Utils.getImage(condition),
						cssClass: `toggle${active}`,

						onClick: async () => {
							switch (id) {
								case 'overwatch':
									if (await myActor.hasCondition('overwatch')) {
										await myActor.removeCondition('overwatch');
									} else {
										await myActor.addCondition('overwatch');
									}
									break;
								case 'panicked':
									await this.toggleConditionState(this.isRightClick, myActor, 'panic', 'panic');
									break;

								default:
									await this.toggleConditionState(this.isRightClick, myActor, id, id);

									break;
							}
						},
					});
					return newActions;
				})
			);
			// Create group data
			const groupData = { id: 'conditions', type: 'system' };

			// Add actions to HUD
			this.addActions(newActions, groupData);
		}
		async toggleConditionState(rightClick, myActor, property, valueName) {
			let rData = [];
			let value = myActor.system.general[property][valueName];
			let max = '1';
			let update = {};
			// debugger;
			switch (rightClick) {
				case true:
					{
						switch (property) {
							case 'panic':
								{
									if (value <= 0) return;
									await myActor.checkAndEndPanic(myActor);
									update = {
										data: { general: { [property]: { [valueName]: 0 } } },
									};
									await myActor.update(update);
								}
								break;
							case 'radiation':
								if (value <= 0) return;
								{
									rData = {
										roll: myActor.system.general.radiation.value,
										label: 'radiation',
									};
									if (myActor.system.general.radiation.value <= 1) {
										await myActor.removeCondition('radiation');
										await myActor.update({
											'system.general.radiation.value': (myActor.system.general.radiation.value = 0),
										});
									} else {
										await myActor.update({
											'system.general.radiation.value': myActor.system.general.radiation.value - 1,
										});
									}
									await myActor.createChatMessage(game.i18n.localize('ALIENRPG.RadiationReduced'), myActor.id);
								}
								break;

							default:
								{
									if (value <= 0) return;
									value--;
									await myActor.removeCondition(property);
									update = {
										data: { general: { [property]: { [valueName]: value } } },
									};
									await myActor.update(update);
								}
								break;
						}
					}
					break;
				case false:
					switch (property) {
						case 'panic':
							{
								rData = {
									panicroll: 'true',
								};
								await myActor.rollAbility(myActor, rData);
							}
							break;
						case 'radiation':
							{
								rData = {
									roll: `${myActor.system.general.radiation.value} `,
									label: 'Radiation',
								};
								if (myActor.system.general.radiation.value === 10) {
									break;
								} else {
									await myActor.rollAbility(myActor, rData);
									await myActor.update({
										'system.general.radiation.value': myActor.system.general.radiation.value + 1,
									});
									await myActor.addCondition('radiation');
								}
							}
							break;
						default:
							{
								if (value >= max) return;
								value++;
								await myActor.addCondition(property);
								update = {
									data: { general: { [property]: { [valueName]: value } } },
								};
								await myActor.update(update);
							}
							break;
					}
				default:
					break;
			}
		}

		async #buildSynthConditions() {
			if (this.tokens?.length === 0) return;

			const actionType = 'conditions';

			// Get conditions
			const conditions = game.alienrpg.config.conditionEffects.filter((condition) => condition.id === 'overwatch' || condition.id == 'radiation');
			// Exit if no conditions exist
			if (conditions.length === 0) return;

			// Get actions
			const actions = await Promise.all(
				conditions.map(async (condition) => {
					const id = condition.id;
					const name = coreModule.api.Utils.i18n(condition.label) ?? condition.name;
					const actionTypeName = `${coreModule.api.Utils.i18n(ACTION_TYPE[actionType])}: ` ?? '';
					const listName = `${actionTypeName}${name}`;
					const encodedValue = [actionType, id].join(this.delimiter);
					const active = this.actors.every((actor) => {
						if (game.version.startsWith('11')) {
							return actor.effects.some((effect) => effect.statuses.some((status) => status === id) && !effect?.disabled);
						} else {
							// V10
							return actor.effects.some((effect) => effect.flags?.core?.statusId === id && !effect?.disabled);
						}
					})
						? ' active'
						: '';
					const cssClass = `toggle${active}`;
					const img = coreModule.api.Utils.getImage(condition);
					const tooltipData = await this.#getConditionTooltipData(id, name);
					const tooltip = await this.#getTooltip(tooltipData);
					return {
						id,
						name,
						encodedValue,
						img,
						cssClass,
						listName,
						tooltip,
					};
				})
			);

			// Create group data
			const groupData = { id: 'conditions', type: 'system' };

			// Add actions to HUD
			this.addActions(actions, groupData);
		}

		async #buildSkills() {
			const actionType = 'skill';

			// Get skills
			const skills = {
				...(!this.actor ? game.alienrpg.config.skills : this.actor.system.skills),
			};

			// Exit if there are no skills
			if (skills.length === 0) return;

			// Get actions
			const actions = Object.entries(skills)
				.map((skill) => {
					try {
						const id = skill[0];
						// const abbreviatedName = id.charAt(0).toUpperCase() + id.slice(1);
						const name = game.alienrpg.config.skills[id] + ' ' + '-' + ' ' + this.actor.system.skills[id].mod;
						const actionTypeName = `${coreModule.api.Utils.i18n(ACTION_TYPE[actionType])}: ` ?? '';
						const listName = `${actionTypeName}${game.alienrpg.config.skills[id]}`;
						const encodedValue = [actionType, id].join(this.delimiter);
						// const mod = skills[id].total
						const tooltip = coreModule.api.Utils.i18n('ALIENRPG.LEFTCLICKTOROLL');
						return {
							id,
							name,
							encodedValue,
							listName,
							tooltip,
						};
					} catch (error) {
						coreModule.api.Logger.error(skill);
						return null;
					}
				})
				.filter((skill) => !!skill);

			// Create group data
			const groupData = { id: 'skills', type: 'system' };

			// Add actions to HUD
			this.addActions(actions, groupData);
		}

		async #buildAttributes() {
			const actionType = 'attributes';

			// Get skills
			const attributes = {
				...(!this.actor ? game.alienrpg.config.attributes : this.actor.system.attributes),
			};
			// Exit if there are no skills
			if (attributes.length === 0) return;

			// Get actions
			const actions = Object.entries(attributes)
				.map((attributes) => {
					try {
						const id = attributes[0];
						// const abbreviatedName = id.charAt(0).toUpperCase() + id.slice(1);
						const name = game.alienrpg.config.attributes[id] + ' ' + '-' + ' ' + this.actor.system.attributes[id].value;
						const actionTypeName = `${coreModule.api.Utils.i18n(ACTION_TYPE[actionType])}: ` ?? '';
						const listName = `${actionTypeName}${game.alienrpg.config.attributes[id]}`;
						const encodedValue = [actionType, id].join(this.delimiter);
						// const mod = attributes[id].total
						const tooltip = coreModule.api.Utils.i18n('ALIENRPG.LEFTCLICKTOROLL');
						return {
							id,
							name,
							encodedValue,
							listName,
							tooltip,
						};
					} catch (error) {
						coreModule.api.Logger.error(attributes);
						return null;
					}
				})
				.filter((attributes) => !!attributes);

			// Create group data
			const groupData = { id: 'attributes', type: 'system' };

			// Add actions to HUD
			this.addActions(actions, groupData);
		}

		async #buildVehicleAttributes() {
			const actionType = 'attributes';

			// Get skills
			let myattributes = {
				...(!this.actor ? game.alienrpg.config.vehicleattributes : this.actor.system.attributes),
			};
			// Exit if there are no skills
			if (myattributes.length === 0) return;
			delete myattributes.weight;
			delete myattributes.comment;
			delete myattributes.passengers;
			delete myattributes.cost;
			delete myattributes.hull;

			// const name = coreModule.api.Utils.i18n('ALIENRPG.Stress') + ' ' + ((max > 0) ? `${value ?? 0}/${max}` : '');

			// Get actions
			const actions = Object.entries(myattributes)
				.map((myattributes) => {
					try {
						const id = myattributes[0];
						// const abbreviatedName = id.charAt(0).toUpperCase() + id.slice(1);
						const name = game.alienrpg.config.vehicleattributes[id] + ' ' + '-' + ' ' + this.actor.system.attributes[id].value;
						const actionTypeName = `${coreModule.api.Utils.i18n(ACTION_TYPE[actionType])}: ` ?? '';
						const listName = `${actionTypeName}${game.alienrpg.config.vehicleattributes[id]}`;
						const encodedValue = [actionType, id].join(this.delimiter);
						// const mod = attributes[id].total
						const tooltip = coreModule.api.Utils.i18n('ALIENRPG.LEFTCLICKTOROLL');
						return {
							id,
							name,
							encodedValue,
							listName,
							tooltip,
						};
					} catch (error) {
						coreModule.api.Logger.error(myattributes);
						return null;
					}
				})
				.filter((myattributes) => !!myattributes);

			// Create group data
			const groupData = { id: 'attributes', type: 'system' };

			// Add actions to HUD
			this.addActions(actions, groupData);
		}
		async #buildSpacecraftAttributes() {
			const actionType = 'attributes';

			// Get skills
			let myattributes = {
				...(!this.actor ? game.alienrpg.config.spacecraftattributes : this.actor.system.attributes),
			};
			// Exit if there are no skills
			if (myattributes.length === 0) return;
			delete myattributes.ai;
			delete myattributes.armaments;
			delete myattributes.crew;
			delete myattributes.length;
			delete myattributes.leasecost;
			delete myattributes.modules;
			delete myattributes.model;
			delete myattributes.manufacturer;
			delete myattributes.damage;

			// const name = coreModule.api.Utils.i18n('ALIENRPG.Stress') + ' ' + ((max > 0) ? `${value ?? 0}/${max}` : '');

			// Get actions
			const actions = Object.entries(myattributes)
				.map((myattributes) => {
					try {
						const id = myattributes[0];
						// const abbreviatedName = id.charAt(0).toUpperCase() + id.slice(1);
						const name = game.alienrpg.config.spacecraftattributes[id] + ' ' + '-' + ' ' + this.actor.system.attributes[id].value;
						const actionTypeName = `${coreModule.api.Utils.i18n(ACTION_TYPE[actionType])}: ` ?? '';
						const listName = `${actionTypeName}${game.alienrpg.config.spacecraftattributes[id]}`;
						const encodedValue = [actionType, id].join(this.delimiter);
						// const mod = attributes[id].total
						// const info1 = (this.actor) ? { text: (mod || mod === 0) ? `${(mod >= 0) ? '+' : ''}${mod}` : '' } : ''
						return {
							id,
							name,
							encodedValue,
							// info1,
							listName,
						};
					} catch (error) {
						coreModule.api.Logger.error(myattributes);
						return null;
					}
				})
				.filter((myattributes) => !!myattributes);

			// Create group data
			const groupData = { id: 'attributes', type: 'system' };

			// Add actions to HUD
			this.addActions(actions, groupData);
		}

		async #buildCreatureAttributes() {
			const actionType = 'attributes';
			// Get skills
			const attributes1 = {
				...(!this.actor ? game.alienrpg.config.creatureattributes : this.actor.system.attributes),
			};
			const attributes2 = {
				...(!this.actor ? game.alienrpg.config.creatureattributes : this.actor.system.general),
			};
			// get the attributes in general as well
			// attributes = Object.assign(attributes) ? game.alienrpg.config.creatureattributes : (this.actor.system.general);
			// Exit if there are no skills
			let myattributes = { ...attributes1, ...attributes2 };
			if (myattributes.length === 0) return;
			delete myattributes.acidSplash;
			delete myattributes.armorrating;
			delete myattributes.armorvfire;
			delete myattributes.comment;
			delete myattributes.critInj;
			delete myattributes.special;

			// Get actions
			const actions = Object.entries(myattributes)
				.map((myattributes) => {
					try {
						const id = myattributes[0];
						// const abbreviatedName = id.charAt(0).toUpperCase() + id.slice(1);
						const name = game.alienrpg.config.creatureattributes[id] + ' ' + '-' + ' ' + `${myattributes[1].value}`;
						const actionTypeName = `${coreModule.api.Utils.i18n(ACTION_TYPE[actionType])}: ` ?? '';
						const listName = `${actionTypeName}${game.alienrpg.config.creatureattributes[id]}`;
						const encodedValue = [actionType, id].join(this.delimiter);
						// const mod = attributes[id].total
						const tooltip = coreModule.api.Utils.i18n('ALIENRPG.LEFTCLICKTOROLL');
						return {
							id,
							name,
							encodedValue,
							listName,
							tooltip,
						};
					} catch (error) {
						coreModule.api.Logger.error(myattributes);
						return null;
					}
				})
				.filter((myattributes) => !!myattributes);

			// Create group data
			const groupData = { id: 'attributes', type: 'system' };

			// Add actions to HUD
			this.addActions(actions, groupData);
		}

		async #buildCreatureDefence() {
			const actionType = 'defence';
			// Get skills
			const defence1 = {
				...(!this.actor ? game.alienrpg.config.creaturedefence : this.actor.system.attributes),
			};
			// get the attributes in general as well
			const defence2 = {
				...(!this.actor ? game.alienrpg.config.creaturedefence : this.actor.system.general),
			};
			// Exit if there are no skills
			let defence = { ...defence1, ...defence2 };
			if (defence.length === 0) return;
			delete defence.speed;
			delete defence.observation;
			delete defence.mobility;
			delete defence.comment;
			delete defence.critInj;
			delete defence.special;

			// Get actions
			const actions = Object.entries(defence)
				.map((defence) => {
					try {
						const id = defence[0];
						// const abbreviatedName = id.charAt(0).toUpperCase() + id.slice(1);
						const name = game.alienrpg.config.creaturedefence[id] + ' ' + '-' + ' ' + `${defence[1].value}`;
						const actionTypeName = `${coreModule.api.Utils.i18n(ACTION_TYPE[actionType])}: ` ?? '';
						const listName = `${actionTypeName}${game.alienrpg.config.creaturedefence[id]}`;
						const encodedValue = [actionType, id].join(this.delimiter);
						// const mod = attributes[id].total
						const tooltip = coreModule.api.Utils.i18n('ALIENRPG.LEFTCLICKTOROLL');
						return {
							id,
							name,
							encodedValue,
							listName,
							tooltip,
						};
					} catch (error) {
						coreModule.api.Logger.error(defence);
						return null;
					}
				})
				.filter((defence) => !!defence);

			// Create group data
			const groupData = { id: 'defence', type: 'system' };

			// Add actions to HUD
			this.addActions(actions, groupData);
		}

		async #buildTalents() {
			const actionTypeId = 'talents';
			if (this.items.size === 0) return;

			const inventoryMap = new Map();

			for (const [itemId, itemData] of this.items) {
				const type = itemData.type;
				// debugger;

				if (type === 'talent') {
					const typeMap = inventoryMap.get(type) ?? new Map();
					typeMap.set(itemId, itemData);
					inventoryMap.set(type, typeMap);
				} else {
					continue;
				}
			}

			for (const [type, typeMap] of inventoryMap) {
				const groupId = ITEM_TYPE[type]?.groupId;

				if (!groupId) continue;

				const groupData = { id: groupId, type: 'system' };

				// Get actions
				const actions = [...typeMap].map(([itemId, itemData]) => {
					const id = itemId;
					const name = itemData.name;
					const actionTypeName = coreModule.api.Utils.i18n(ACTION_TYPE[actionTypeId]);
					const listName = `${actionTypeName ? `${actionTypeName}: ` : ''}${name}`;
					const encodedValue = [actionTypeId, id].join(this.delimiter);

					return {
						id,
						name,
						listName,
						encodedValue,
					};
				});

				// TAH Core method to add actions to the action list
				this.addActions(actions, groupData);
			}
		}

		async #buildAgenda() {
			const actionTypeId = 'agenda';
			if (this.items.size === 0) return;

			const inventoryMap = new Map();

			for (const [itemId, itemData] of this.items) {
				const type = itemData.type;

				if (type === 'agenda') {
					const typeMap = inventoryMap.get(type) ?? new Map();
					typeMap.set(itemId, itemData);
					inventoryMap.set(type, typeMap);
				} else {
					continue;
				}
			}

			for (const [type, typeMap] of inventoryMap) {
				const groupId = ITEM_TYPE[type]?.groupId;

				if (!groupId) continue;

				const groupData = { id: groupId, type: 'system' };

				// Get actions
				const actions = [...typeMap].map(([itemId, itemData]) => {
					const id = itemId;
					const name = itemData.name;
					const actionTypeName = coreModule.api.Utils.i18n(ACTION_TYPE[actionTypeId]);
					const listName = `${actionTypeName ? `${actionTypeName}: ` : ''}${name}`;
					const encodedValue = [actionTypeId, id].join(this.delimiter);

					return {
						id,
						name,
						listName,
						encodedValue,
					};
				});

				// TAH Core method to add actions to the action list
				this.addActions(actions, groupData);
			}
		}

		async #buildHealth() {
			const actionTypeId = 'health';
			let actions = [];
			let myActor = this.actor;
			let rightClick = this.isRightClick;
			const groupData = { id: 'utility', type: 'system' };
			let value = this.actor.system.header?.health.value;
			const max = this.actor.system.header?.health?.max;

			// Get actions
			const actionTypeName = coreModule.api.Utils.i18n(ACTION_TYPE[actionTypeId]);

			actions.push({
				id: 'health',
				name: coreModule.api.Utils.i18n('ALIENRPG.Health') + ' ' + (max > 0 ? `${value ?? 0}/${max}` : ''),
				listName: `${actionTypeName ? `${actionTypeName}: ` : ''}${name}`,
				tooltip: coreModule.api.Utils.i18n('ALIENRPG.ConButtons'),

				onClick: async () => {
					if (rightClick) {
						if (value <= 0) return;
						value--;
					} else {
						if (value >= max) return;
						value++;
					}

					let update = { system: { header: { [actionTypeId]: { value: value } } } };

					await myActor.update(update);
				},
			});
			// TAH Core method to add actions to the action list
			this.addActions(actions, groupData);
		}

		async #buildHull() {
			const actionTypeId = 'hull';
			// if (this.items.health === 0) return;
			// debugger;

			const groupData = { id: 'utility', type: 'system' };

			const value = this.actor.system.attributes?.hull.value;
			const max = this.actor.system.attributes?.hull?.max;

			// Get actions
			const id = actionTypeId;
			const name = coreModule.api.Utils.i18n('ALIENRPG.Hull') + ' ' + (max > 0 ? `${value ?? 0}/${max}` : '');
			const actionTypeName = coreModule.api.Utils.i18n(ACTION_TYPE[actionTypeId]);
			const listName = `${actionTypeName ? `${actionTypeName}: ` : ''}${name}`;
			const encodedValue = [actionTypeId, id].join(this.delimiter);
			const tooltip = coreModule.api.Utils.i18n('ALIENRPG.ConButtons');
			const actions = [
				{
					id,
					name,
					listName,
					encodedValue,
					tooltip,
				},
			];
			// TAH Core method to add actions to the action list
			this.addActions(actions, groupData);
		}

		async #buildSpacecraftDamage() {
			const actionTypeId = 'damage';
			// if (this.items.health === 0) return;
			// debugger;

			const groupData = { id: 'utility', type: 'system' };

			const value = this.actor.system.attributes?.damage.value;
			const max = this.actor.system.attributes?.damage?.max;

			// Get actions
			const id = actionTypeId;
			const name = coreModule.api.Utils.i18n('ALIENRPG.DAMAGE') + ' ' + (max > 0 ? `${value ?? 0}/${max}` : '');
			const actionTypeName = coreModule.api.Utils.i18n(ACTION_TYPE[actionTypeId]);
			const listName = `${actionTypeName ? `${actionTypeName}: ` : ''}${name}`;
			const encodedValue = [actionTypeId, id].join(this.delimiter);
			const tooltip = coreModule.api.Utils.i18n('ALIENRPG.ConButtons');
			const actions = [
				{
					id,
					name,
					listName,
					encodedValue,
					tooltip,
				},
			];
			// TAH Core method to add actions to the action list
			this.addActions(actions, groupData);
		}
		async #buildStress() {
			let actions = [];
			const actionTypeId = 'stress';
			let myActor = this.actor;
			let rightClick = this.isRightClick;
			const groupData = { id: 'utility', type: 'system' };

			let value = myActor.system.header?.stress.value;
			let max = myActor.system.header?.stress?.max;

			// Get actions
			const actionTypeName = coreModule.api.Utils.i18n(ACTION_TYPE[actionTypeId]);

			actions.push({
				id: 'actionTypeId',
				name: coreModule.api.Utils.i18n('ALIENRPG.Stress') + ' ' + (max > 0 ? `${value ?? 0}/${max}` : ''),
				listName: `${actionTypeName ? `${actionTypeName}: ` : ''}${name}`,
				tooltip: coreModule.api.Utils.i18n('ALIENRPG.ConButtons'),

				onClick: async () => {
					if (rightClick) {
						if (value <= 0) return;
						value--;
					} else {
						if (value >= max) return;
						value++;
					}

					let update = { system: { header: { [actionTypeId]: { value: value } } } };

					await myActor.update(update);
				},
			});
			// TAH Core method to add actions to the action list
			this.addActions(actions, groupData);
		}

		async #buildCrit() {
			const actionTypeId = 'criticalinjury';
			// if (this.items.health === 0) return;
			// debugger;

			const groupData = { id: 'utility', type: 'system' };

			// Get actions
			const id = actionTypeId;
			const name = coreModule.api.Utils.i18n('ALIENRPG.RollCrit');
			const actionTypeName = coreModule.api.Utils.i18n(ACTION_TYPE[actionTypeId]);
			const listName = `${actionTypeName ? `${actionTypeName}: ` : ''}${name}`;
			const encodedValue = [actionTypeId, id].join(this.delimiter);
			const tooltip = coreModule.api.Utils.i18n('ALIENRPG.LEFTCLICKTOROLL');
			const actions = [
				{
					id,
					name,
					listName,
					encodedValue,
					tooltip,
				},
			];
			// TAH Core method to add actions to the action list
			this.addActions(actions, groupData);
		}
		async #buildMinorCrit() {
			const actionTypeId = 'spacecraft-minor';
			// if (this.items.health === 0) return;
			// debugger;

			const groupData = { id: 'utility', type: 'system' };

			// Get actions
			const id = actionTypeId;
			const name = coreModule.api.Utils.i18n('ALIENRPG.MINOR-COMPONENT-DAMAGE');
			const actionTypeName = coreModule.api.Utils.i18n(ACTION_TYPE[actionTypeId]);
			const listName = `${actionTypeName ? `${actionTypeName}: ` : ''}${name}`;
			const encodedValue = [actionTypeId, id].join(this.delimiter);
			const tooltip = coreModule.api.Utils.i18n('ALIENRPG.LEFTCLICKTOROLL');
			const actions = [
				{
					id,
					name,
					listName,
					encodedValue,
					tooltip,
				},
			];
			// TAH Core method to add actions to the action list
			this.addActions(actions, groupData);
		}
		async #buildMajorCrit() {
			const actionTypeId = 'spacecraft-major';
			// if (this.items.health === 0) return;
			// debugger;

			const groupData = { id: 'utility', type: 'system' };

			// Get actions
			const id = actionTypeId;
			const name = coreModule.api.Utils.i18n('ALIENRPG.MAJOR-COMPONENT-DAMAGE');
			const actionTypeName = coreModule.api.Utils.i18n(ACTION_TYPE[actionTypeId]);
			const listName = `${actionTypeName ? `${actionTypeName}: ` : ''}${name}`;
			const encodedValue = [actionTypeId, id].join(this.delimiter);
			const tooltip = coreModule.api.Utils.i18n('ALIENRPG.LEFTCLICKTOROLL');
			const actions = [
				{
					id,
					name,
					listName,
					encodedValue,
					tooltip,
				},
			];
			// TAH Core method to add actions to the action list
			this.addActions(actions, groupData);
		}

		async #buildCreatureAttack() {
			const groupData = { id: 'attackroll', type: 'system' };

			const actionTypeId = 'attackroll';
			const id = actionTypeId;
			const name = coreModule.api.Utils.i18n('ALIENRPG.AttackRoll');
			const actionTypeName = coreModule.api.Utils.i18n(ACTION_TYPE[actionTypeId]);
			const listName = `${actionTypeName ? `${actionTypeName}: ` : ''}${name}`;
			const encodedValue = [actionTypeId, id].join(this.delimiter);
			const tooltip = coreModule.api.Utils.i18n('ALIENRPG.LEFTCLICKTOROLL');
			const actions = [
				{
					id,
					name,
					listName,
					encodedValue,
					tooltip,
				},
			];
			// TAH Core method to add actions to the action list
			this.addActions(actions, groupData);
		}

		/**
		 * Get actors
		 * @private
		 * @returns {object}
		 */
		async #getActors() {
			const allowedTypes = ['character', 'synthetic'];
			const actors = canvas.tokens.controlled.filter((token) => token.actor).map((token) => token.actor);
			if (actors.every((actor) => allowedTypes.includes(actor.type))) {
				return actors;
			} else {
				return [];
			}
		}

		/**
		 * Get tokens
		 * @private
		 * @returns {object}
		 */
		async #getTokens() {
			const allowedTypes = ['character', 'synthetic'];
			const tokens = canvas.tokens.controlled;
			const actors = tokens.filter((token) => token.actor).map((token) => token.actor);
			if (actors.every((actor) => allowedTypes.includes(actor.type))) {
				return tokens;
			} else {
				return [];
			}
		}

		/**
		 * Get condition tooltip data
		 * @param {*} id     The condition id
		 * @param {*} name   The condition name
		 * @returns {object} The tooltip data
		 */
		async #getConditionTooltipData(id, name) {
			if (this.showtooltip === false) return '';
			const description = CONDITION[id] ? CONDITION[id]?.description : null;
			return {
				name,
				description,
			};
		}
		/**
		 * Get tooltip
		 * @param {object} tooltipData The tooltip data
		 * @returns {string}           The tooltip
		 */
		async #getTooltip(tooltipData) {
			if (this.showtooltip === false) return '';
			// if (typeof tooltipData === 'string') return tooltipData;

			const name = coreModule.api.Utils.i18n(tooltipData.name);

			// if (this.tooltipsSetting === 'nameOnly') return name;

			const nameHtml = `<h3>${name}</h3>`;

			const description =
				tooltipData?.descriptionLocalised ?? (await TextEditor.enrichHTML(coreModule.api.Utils.i18n(tooltipData?.description ?? ''), { async: false }));

			const rarityHtml = tooltipData?.rarity
				? `<span class="tah-tag ${tooltipData.rarity}">${coreModule.api.Utils.i18n(RARITY[tooltipData.rarity])}</span>`
				: '';

			const propertiesHtml = tooltipData?.properties
				? `<div class="tah-properties">${tooltipData.properties
						.map((property) => `<span class="tah-property">${coreModule.api.Utils.i18n(property)}</span>`)
						.join('')}</div>`
				: '';

			const traitsHtml = tooltipData?.traits
				? tooltipData.traits.map((trait) => `<span class="tah-tag">${coreModule.api.Utils.i18n(trait.label ?? trait)}</span>`).join('')
				: '';

			const traits2Html = tooltipData?.traits2
				? tooltipData.traits2.map((trait) => `<span class="tah-tag tah-tag-secondary">${coreModule.api.Utils.i18n(trait.label ?? trait)}</span>`).join('')
				: '';

			const traitsAltHtml = tooltipData?.traitsAlt
				? tooltipData.traitsAlt.map((trait) => `<span class="tah-tag tah-tag-alt">${coreModule.api.Utils.i18n(trait.label)}</span>`).join('')
				: '';

			const modifiersHtml = tooltipData?.modifiers
				? `<div class="tah-tags">${tooltipData.modifiers
						.filter((modifier) => modifier.enabled)
						.map((modifier) => {
							const label = coreModule.api.Utils.i18n(modifier.label);
							const sign = modifier.modifier >= 0 ? '+' : '';
							const mod = `${sign}${modifier.modifier ?? ''}`;
							return `<span class="tah-tag tah-tag-transparent">${label} ${mod}</span>`;
						})
						.join('')}</div>`
				: '';

			const tagsJoined = [rarityHtml, traitsHtml, traits2Html, traitsAltHtml].join('');

			const tagsHtml = tagsJoined ? `<div class="tah-tags">${tagsJoined}</div>` : '';

			const headerTags = tagsHtml || modifiersHtml ? `<div class="tah-tags-wrapper">${tagsHtml}${modifiersHtml}</div>` : '';

			if (!description && !tagsHtml && !modifiersHtml) return name;

			return `<div>${nameHtml}${headerTags}${description}${propertiesHtml}</div>`;
		}

		async #buildStatusEffects() {
			if (this.tokens?.length === 0) return;
			let myActor = this.actor;
			// let id = '';
			// let rightClick = false;
			const actionType = 'fastslow';

			// Get conditions
			const fastSlow = game.alienrpg.config.StatusEffects.slowAndFastActions;

			// Exit if no fastSlow exist
			if (fastSlow.length === 0) return;
			let newActions = [];
			// Get actions
			const actions = await Promise.all(
				fastSlow.map(async (condition) => {
					let id = condition.id;
					const actionTypeName = `${coreModule.api.Utils.i18n(ACTION_TYPE[actionType])}: ` ?? '';
					const active = this.actors.every((actor) => {
						return actor.effects.some((effect) => effect.statuses.some((status) => status === id) && !effect?.disabled);
					})
						? ' active'
						: '';
					const rightClick = this.isRightClick;
					newActions.push({
						id: id,
						name: coreModule.api.Utils.i18n(condition.label) ?? condition.name,
						listName: `${actionTypeName}${name}`,
						img: coreModule.api.Utils.getImage(condition),
						cssClass: `toggle${active}`,

						onClick: async () => {
							switch (id) {
								case 'slowAction':
									if (await myActor.hasCondition('slowAction')) {
										await myActor.removeFastSlow('slowAction');
									} else {
										await myActor.addFastSlow('slowAction');
									}
									break;
								case 'fastAction':
									if (await myActor.hasCondition('fastAction')) {
										await myActor.removeFastSlow('fastAction');
									} else {
										await myActor.addFastSlow('fastAction');
									}
									break;
							}
						},
					});
					return newActions;
				})
			);
			// Create group data
			const groupData = { id: 'utility', type: 'system' };
			// Add actions to HUD
			this.addActions(newActions, groupData);
		}
	};
});
