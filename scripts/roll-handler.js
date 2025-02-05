export let RollHandler = null;

Hooks.once('tokenActionHudCoreApiReady', async (coreModule) => {
	/**
	 * Extends Token Action HUD Core's RollHandler class and handles action events triggered when an action is clicked
	 */
	RollHandler = class RollHandler extends coreModule.api.RollHandler {
		/**
		 * Handle action event
		 * Called by Token Action HUD Core when an action event is triggered
		 * @override
		 * @param {object} event        The event
		 * @param {string} encodedValue The encoded value
		 */
		async handleActionClick(event, encodedValue) {
			const payload = encodedValue.split('|');

			if (payload.length !== 2) {
				super.throwInvalidValueErr();
			}

			const actionTypeId = payload[0];
			const actionId = payload[1];

			const renderable = [];

			if (renderable.includes(actionTypeId) && this.isRenderItem()) {
				return this.RenderItem(this.actor, actionId);
			}

			const knownCharacters = ['character', 'synthetic', 'creature'];

			// If single actor is selected
			if (this.actor) {
				await this.#handleAction(event, this.actor, this.token, actionTypeId, actionId);
				return;
			}

			const controlledTokens = canvas.tokens.controlled.filter((token) => knownCharacters.includes(token.actor?.type));

			// If multiple actors are selected
			for (const token of controlledTokens) {
				const actor = token.actor;
				await this.#handleAction(event, actor, token, actionTypeId, actionId);
			}
		}

		/**
		 * Handle action
		 * @private
		 * @param {object} event        The event
		 * @param {object} actor        The actor
		 * @param {object} token        The token
		 * @param {string} actionTypeId The action type id
		 * @param {string} actionId     The actionId
		 */
		async #handleAction(event, actor, token, actionTypeId, actionId) {
			switch (actor.type) {
				case 'character':
				case 'synthetic':
					{
						switch (actionTypeId) {
							case 'attributes':
								await this.#handleAttributeAction(event, actor, actionId);
								break;
							case 'item':
								{
									const actorItem = actor.items.get(actionId);
									switch (actorItem.type) {
										case 'weapon':
											await this.#handleWeaponAction(event, actor, actionId, actorItem);
											break;
										case 'armor':
											await this.#handleUArmorAction(event, actor, actionId, actorItem);
											break;
										default:
											await this.renderItem(this.actor, actionId);
											break;
									}
								}
								break;

							case 'skill':
								await this.#handleSkillAction(event, actor, actionId);
								break;
							// case 'conditions':
							// 	await this.#handleConditionAction(event, actor, actionId);
							// 	break;
							// case 'health':
							// 	await this.#adjustAttribute(actor, 'health', 'value');
							// 	break;
							// case 'stress':
							// 	await this.#adjustAttribute(actor, 'stress', 'value');
							// 	break;
							case 'criticalinjury':
								await this.#handleCritAction(actor, event);
								break;

							default:
								await this.renderItem(this.actor, actionId);
								break;
						}
					}
					break;
				case 'creature':
					{
						switch (actionTypeId) {
							case 'attributes':
								await this.#handleCreatureAttributeAction(event, actor, actionId);
								break;
							case 'defence':
								await this.#handleCreatureAttributeAction(event, actor, actionId);
								break;
							case 'attackroll':
								await this.#handleCreatureAttackAction(actor, event);
								break;
							// case 'health':
							// 	await this.#adjustAttribute(actor, 'health', 'value');
							// 	break;
							case 'criticalinjury':
								await this.#handleCritAction(actor, event);
								break;

							default:
								break;
						}
					}
					break;
				case 'vehicles': {
					switch (actionTypeId) {
						case 'item':
							{
								const actorItem = actor.items.get(actionId);
								switch (actorItem.type) {
									case 'weapon':
										await this.#handleWeaponAction(event, actor, actionId, actorItem);
										break;
									default:
										await this.renderItem(this.actor, actionId);
										break;
								}
							}
							break;
						case 'hull':
							await this.#adjustHull(actor, 'hull', 'value');
							break;

						default:
							if (actionId === 'armorrating') {
								await this.#handleVehicleArmorAction(event, actor, actionId);
								break;
							}
					}
				}
				case 'spacecraft': {
					switch (actionTypeId) {
						case 'armaments':
							{
								const actorItem = actor.items.get(actionId);
								switch (actorItem.system.header.type.value) {
									case '1':
									case '2':
										await this.#handleWeaponAction(event, actor, actionId, actorItem);
										break;
									default:
										await this.renderItem(this.actor, actionId);
										break;
								}
							}
							break;
						case 'damage':
							await this.#adjustHull(actor, 'damage', 'value');
							break;
						case 'attributes':
							if (actionId === 'armor') {
								await this.#handleVehicleArmorAction(event, actor, actionId);
							}
							break;
						case 'spacecraft-minor':
							await this.#handleSpacecraftCritAction(actor, event, 'minor');
							break;
						case 'spacecraft-major':
							await this.#handleSpacecraftCritAction(actor, event, 'major');
							break;
					}
				}
			}
		}

		/**
		 * Handle Attribute action
		 * @private
		 * @param {object} event    The event
		 * @param {object} actor    The actor
		 * @param {string} actionId The action id
		 */
		async #handleAttributeAction(event, actor, actionId) {
			let rData = [];
			if (!actor) return;
			if (!actor.system?.attributes) return;
			rData = {
				roll: actor.system.attributes[actionId].value,
				mod: actor.system.attributes[actionId].mod,
				label: actor.system.attributes[actionId].label,
				attr: 'attribute',
			};
			if (event.type === 'click') {
				await actor.rollAbility(actor, rData);
			} else {
				await actor.rollAbilityMod(actor, rData);
			}
		}
		/**
		 * Handle Creature Attribute action
		 * @private
		 * @param {object} event    The event
		 * @param {object} actor    The actor
		 * @param {string} actionId The action id
		 */
		async #handleCreatureAttributeAction(event, actor, actionId) {
			let rData = [];
			if (!actor) return;
			switch (actionId) {
				case 'speed':
				case 'armorrating':
				case 'armorvfire':
					{
						rData = {
							roll: actor.system.attributes[actionId].value,
							label: coreModule.api.Utils.i18n(game.alienrpg.config.creaturedefence[actionId]),
						};
					}
					if (event.type === 'click') {
						await actor.rollAbility(actor, rData);
					} else {
						await actor.rollAbilityMod(actor, rData);
					}
					break;
				case 'mobility':
				case 'observation':
					{
						rData = {
							roll: actor.system.general[actionId].value,
							label: actor.system.general[actionId].label,
						};
					}
					if (event.type === 'click') {
						await actor.rollAbility(actor, rData);
					} else {
						await actor.rollAbilityMod(actor, rData);
					}
					break;
				case 'acidSplash':
					{
						rData = {
							roll: actor.system.general[actionId].value,
							label: coreModule.api.Utils.i18n(game.alienrpg.config.creaturedefence[actionId]),
						};
						await actor.creatureAcidRoll(actor, rData);
					}
					break;
			}
		}

		/**
		 * Handle Skill action
		 * @private
		 * @param {object} event    The event
		 * @param {object} actor    The actor
		 * @param {string} actionId The action id
		 */
		async #handleSkillAction(event, actor, actionId) {
			let rData = [];
			if (!actor) return;
			if (!actor.system?.skills) return;
			rData = {
				roll: actor.system.skills[actionId].mod,
				label: actor.system.skills[actionId].label,
			};
			if (event.type === 'click') {
				await actor.rollAbility(actor, rData);
			} else {
				await actor.rollAbilityMod(actor, rData);
			}
		}
		/**
		 * Handle Armour action
		 * @private
		 * @param {object} event    The event
		 * @param {object} actor    The actor
		 * @param {string} actionId The action id
		 */
		async #handleUArmorAction(event, actor, actionId, actorItem) {
			let rData = [];
			if (!actor) return;
			// if (!actor.system?.skills) return
			rData = {
				roll: actor.system.general.armor.value,
				spbutt: 'armor',
			};
			if (event.type === 'click') {
				await actor.rollAbility(actor, rData);
			} else {
				await actor.rollAbilityMod(actor, rData);
			}
		}
		/**
		 * Handle Armour action
		 * @private
		 * @param {object} event    The event
		 * @param {object} actor    The actor
		 * @param {string} actionId The action id
		 */
		async #handleVehicleArmorAction(event, actor, actionId) {
			let rData = [];
			if (!actor) return;
			// if (!actor.system?.skills) return
			switch (actor.type) {
				case 'spacecraft':
					rData = {
						roll: actor.system.attributes.armor.value,
						spbutt: 'armor',
					};
					break;
				case 'vehicles':
					rData = {
						roll: actor.system.attributes.armorrating.value,
						spbutt: 'armor',
					};
					break;
				default:
					break;
			}

			if (event.type === 'click') {
				await actor.rollAbility(actor, rData);
			} else {
				await actor.rollAbilityMod(actor, rData);
			}
		}

		/**
		 * Handle Weapon action
		 * @private
		 * @param {object} event    The event
		 * @param {object} actor    The actor
		 * @param {string} actionId The action id
		 */
		async #handleWeaponAction(event, actor, actionId, actorItem) {
			// const item = actor.items.get(actionId);
			if (event.type === 'click') {
				await actor.nowRollItem(actorItem);
			} else {
				await actor.rollItemMod(actorItem);
			}
		}

		/**
		 * Handle Attribute action
		 * @private
		 * @param {object} event    The event
		 * @param {object} actor    The actor
		 * @param {string} actionId The action id
		 */
		// async #handleConditionAction(event, actor, actionId) {
		// 	// debugger;
		// 	switch (actionId) {
		// 		case 'starving':
		// 			await this.toggleConditionState(event, actor, 'starving', 'value');
		// 			break;
		// 		case 'dehydrated':
		// 			await this.toggleConditionState(event, actor, 'dehydrated', 'value');
		// 			break;
		// 		case 'exhausted':
		// 			await this.toggleConditionState(event, actor, 'exhausted', 'value');
		// 			break;
		// 		case 'freezing':
		// 			await this.toggleConditionState(event, actor, 'freezing', 'value');
		// 			break;
		// 		case 'panicked':
		// 			await this.toggleConditionState(event, actor, 'panic', 'value');
		// 			break;
		// 		case 'overwatch':
		// 			{
		// 				if (await actor.hasCondition('overwatch')) {
		// 					await this.actor.removeCondition('overwatch');
		// 				} else {
		// 					await actor.addCondition('overwatch');
		// 				}
		// 			}
		// 			break;
		// 		case 'radiation':
		// 			await this.toggleConditionState(event, actor, 'radiation', 'value');
		// 			break;
		// 	}
		// }

		// async toggleConditionState(event, actor, property, valueName) {
		// 	let rData = [];
		// 	let value = actor.system.general[property][valueName];
		// 	let max = '1';
		// 	let update = {};
		// 	// debugger;
		// 	switch (event.type) {
		// 		case 'contextmenu':
		// 			{
		// 				switch (property) {
		// 					case 'panic':
		// 						{
		// 							if (value <= 0) return;
		// 							await actor.checkAndEndPanic(actor);
		// 							update = {
		// 								data: { general: { [property]: { [valueName]: 0 } } },
		// 							};
		// 							await actor.update(update);
		// 						}
		// 						break;
		// 					case 'radiation':
		// 						if (value <= 0) return;
		// 						{
		// 							rData = {
		// 								roll: actor.system.general.radiation.value,
		// 								label: 'radiation',
		// 							};
		// 							if (actor.system.general.radiation.value <= 1) {
		// 								await actor.removeCondition('radiation');
		// 								await actor.update({
		// 									'system.general.radiation.value': (actor.system.general.radiation.value = 0),
		// 								});
		// 							} else {
		// 								await actor.update({
		// 									'system.general.radiation.value': actor.system.general.radiation.value - 1,
		// 								});
		// 							}
		// 							await actor.createChatMessage(game.i18n.localize('ALIENRPG.RadiationReduced'), actor.id);
		// 						}
		// 						break;

		// 					default:
		// 						{
		// 							if (value <= 0) return;
		// 							value--;
		// 							await actor.removeCondition(property);
		// 							update = {
		// 								data: { general: { [property]: { [valueName]: value } } },
		// 							};
		// 							await actor.update(update);
		// 						}
		// 						break;
		// 				}
		// 			}
		// 			break;
		// 		case 'click':
		// 			switch (property) {
		// 				case 'panic':
		// 					{
		// 						rData = {
		// 							panicroll: 'true',
		// 						};
		// 						await actor.rollAbility(actor, rData);
		// 					}
		// 					break;
		// 				case 'radiation':
		// 					{
		// 						rData = {
		// 							roll: `${actor.system.general.radiation.value} `,
		// 							label: 'Radiation',
		// 						};
		// 						if (actor.system.general.radiation.value === 10) {
		// 							break;
		// 						} else {
		// 							await actor.rollAbility(actor, rData);
		// 							await actor.update({
		// 								'system.general.radiation.value': actor.system.general.radiation.value + 1,
		// 							});
		// 							await actor.addCondition('radiation');
		// 						}
		// 					}
		// 					break;
		// 				default:
		// 					{
		// 						if (value >= max) return;
		// 						value++;
		// 						await actor.addCondition(property);
		// 						update = {
		// 							data: { general: { [property]: { [valueName]: value } } },
		// 						};
		// 						await actor.update(update);
		// 					}
		// 					break;
		// 			}
		// 		default:
		// 			break;
		// 	}
		// }

		async #handleCreatureAttackAction(actor, event) {
			const rAttData = { atttype: actor.system.rTables };
			switch (event.type) {
				case 'contextmenu':
					actor.creatureManAttackRoll(actor, rAttData);
					break;
				case 'click':
					actor.creatureAttackRoll(actor, rAttData);
				default:
					break;
			}
		}

		async #handleCritAction(actor, event) {
			const rData = {
				atttype: actor.system.cTables,
			};
			switch (event.type) {
				case 'contextmenu':
					actor.rollCritMan(actor, actor.type, rData);
					break;
				case 'click':
					actor.rollCrit(actor, actor.type, rData);
				default:
					break;
			}
		}
		async #handleSpacecraftCritAction(actor, event, eType) {
			let rData = '';
			switch (eType) {
				case 'minor':
					rData = { crbut: 'minor' };
					break;
				case 'major':
					rData = { crbut: 'major' };
					break;
				default:
					break;
			}

			switch (event.type) {
				case 'contextmenu':
					actor.rollCritMan(actor, actor.type, rData);
					break;
				case 'click':
					actor.rollCrit(actor, actor.type, rData);
				default:
					break;
			}
		}

		// async #adjustAttribute(actor, property, valueName) {
		// 	let value = actor.system.header[property][valueName];
		// 	let max = actor.system.header[property].max;

		// 	if (this.rightClick) {
		// 		if (value <= 0) return;
		// 		value--;
		// 	} else {
		// 		if (value >= max) return;
		// 		value++;
		// 	}

		// 	let update = { system: { header: { [property]: { [valueName]: value } } } };

		// 	await actor.update(update);
		// }
		async #adjustHull(actor, property, valueName) {
			let value = actor.system.attributes[property][valueName];
			let max = actor.system.attributes[property].max;

			if (this.rightClick) {
				if (value <= 0) return;
				value--;
			} else {
				if (value >= max) return;
				value++;
			}

			let update = {
				data: { attributes: { [property]: { [valueName]: value } } },
			};

			await actor.update(update);
		}

		/**
		 * Handle Attribute action
		 * @private
		 * @param {object} event    The event
		 * @param {object} actor    The actor
		 * @param {string} actionId The action id
		 */
		async #handleItemAction(event, actor, actionId) {
			const item = actor.items.get(actionId);
			item.toChat(event);
		}

		/**
		 * Handle utility action
		 * @private
		 * @param {object} token    The token
		 * @param {string} actionId The action id
		 */
		async #handleUtilityAction(token, actionId) {
			switch (actionId) {
				case 'endTurn':
					if (game.combat?.current?.tokenId === token.id) {
						await game.combat?.nextTurn();
					}
					break;
			}
		}
	};
});
