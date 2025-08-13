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
					{
						rData = {
							roll: actor.system.attributes[actionId].value,
							label: coreModule.api.Utils.i18n(game.alienrpg.config.creatureattributes[actionId]),
						};
					}
					if (event.type === 'click') {
						await actor.rollAbility(actor, rData);
					} else {
						await actor.rollAbilityMod(actor, rData);
					}
					break;
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
