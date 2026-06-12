export default class TipsAndTricks {
	constructor(mod: modloader.Mod) {
	}

	async prestart() {
		// @ts-expect-error
		window.codetriangle ??= {};
		// @ts-expect-error
		window.codetriangle.tt ??= {};

		codetriangle.tt.TIP_MODEL_MESSAGE = {
			TIP_ADDED: 0,
		}

		codetriangle.tt.TipsAndTricksModel = ig.GameAddon.extend({
			init() {
				this.tipDatabase = new codetriangle.tt.TipDatabase();
				this.tipDatabase.addLoadListener(this);
				this.observers = [];
				this.tips = new Map();
			},

			onLoadableComplete(success, db) {
				if (!success) {
					console.error("Tip database not loaded!");
				}

				this.addTips(db.tips);
			},

			getLabel(entry) {
				if (typeof entry == "function") {
					entry = entry();
				}

				if (typeof entry == "string") {
					return entry;
				} else {
					return ig.LangLabel.getText(entry);
				}
			},

			addTip(key, tip) {
				if (!this.tipDatabase.loaded) {
					throw new Error("Additional tips cannot be added before the tip database is loaded (are you adding tips during prestart?");
				}

				if (this.tips.has(key)) {
					throw new Error(`Tip already exists: ${key}`);
				}

				this.tips.set(key, tip);

				sc.Model.notifyObserver(
					this,
					codetriangle.tt.TIP_MODEL_MESSAGE.TIP_ADDED,
					{
						key: key,
					}
				);
			},

			addTips(tipObject) {
				for (const [key, tip] of Object.entries(tipObject)) {
					this.addTip(key, tip);
				}
			},

			evaluateTipCondition(tip) {
				if (tip.condition === undefined) {
					return true;
				}
				if (typeof tip.condition == "function") {
					return tip.condition();
				}
				if (typeof tip.condition == "string") {
					tip.condition = new ig.VarCondition(tip.condition);
				}
				return tip.condition.evaluate();
			},
		});

		codetriangle.tt.TipDatabase = ig.JsonLoadable.extend({
			cacheType: "Tips",

			init() {
				this.parent("data/tip-database.json");
				this.tips = {};
			},

			getJsonPath() {
				return this.path;
			},

			onload(data) {
				// @ts-expect-error
				this.tips = data;
			},
		});

		codetriangle.tt.TipsAndTricksGui = ig.GuiElementBase.extend({
			init(config) {
				this.parent();
				this.listeners = [];
				this.refreshInterval = config?.refreshInterval ?? 5;
				this.avoidShowingFor = config?.avoidShowingFor ?? 5;
				this.titleGui = new sc.TextGui("", {font: sc.fontsystem.smallFont});
				this.bodyGui = new sc.TextGui("", {font: sc.fontsystem.smallFont, maxWidth: config?.width ?? 220});
				this.contributorGui = new sc.TextGui("", {font: sc.fontsystem.tinyFont});
				this.setSize(config?.width ?? 220, this.titleGui.hook.size.y + this.bodyGui.hook.size.y + this.contributorGui.hook.size.y + 1);

				this.titleGui.hook.transitions = {
					"DEFAULT": { state: {}, time: 0.2, timeFunction: KEY_SPLINES.LINEAR },
					"HIDDEN": {
						state: {
							alpha: 0,
							offsetX: 10,
						},
						time: 0.2,
						timeFunction: KEY_SPLINES.LINEAR,
					},
				};

				this.bodyGui.hook.transitions = {
					"DEFAULT": { state: {}, time: 0.2, timeFunction: KEY_SPLINES.LINEAR },
					"HIDDEN": {
						state: {
							alpha: 0,
							offsetX: -20,
						},
						time: 0.2,
						timeFunction: KEY_SPLINES.LINEAR,
					},
				};

				this.contributorGui.hook.transitions = {
					"DEFAULT": { state: {}, time: 0.2, timeFunction: KEY_SPLINES.LINEAR },
					"HIDDEN": {
						state: {
							alpha: 0,
							offsetX: 10,
						},
						time: 0.2,
						timeFunction: KEY_SPLINES.LINEAR,
					},
				};

				this.titleGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
				this.bodyGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
				this.contributorGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);

				this.addChildGui(this.titleGui);
				this.addChildGui(this.bodyGui);
				this.addChildGui(this.contributorGui);

				this.titleGui.doStateTransition("HIDDEN", true);
				this.bodyGui.doStateTransition("HIDDEN", true);
				this.contributorGui.doStateTransition("HIDDEN", true);

				this.tipSequence = Array.from(codetriangle.tt.model.tips.keys());
				// shuffle the array
				for (let i = 0; i < this.tipSequence.length; i++) {
					let ridx = Math.floor(Math.random() * this.tipSequence.length);

					let tmp = this.tipSequence[i];
					this.tipSequence[i] = this.tipSequence[ridx];
					this.tipSequence[ridx] = tmp;
				}
				// this.cycleTip();

				this.shownTips = [];

				sc.Model.addObserver(codetriangle.tt.model, this);
			},

			getSequenceValue() {
				return Math.floor(Math.sqrt(Math.random()) * (this.tipSequence.length + 1));
			},

			setTip(tip) {
				this.currentTip = tip;
				let height = 0;
				if (tip.title) {
					this.titleGui.setText("\\c[3]" + codetriangle.tt.model.getLabel(tip.title) + "\\c[0]");
					height += this.titleGui.hook.size.y;
					this.bodyGui.hook.pos.y = 14;
				} else {
					this.titleGui.setText("");
					this.bodyGui.hook.pos.y = 0;
				}

				this.bodyGui.setText(codetriangle.tt.model.getLabel(tip.body));

				height += this.bodyGui.hook.size.y;
				if (tip.contributor) {
					this.contributorGui.setText(codetriangle.tt.model.getLabel(tip.contributor));
					height += this.contributorGui.hook.size.y;
				} else {
					this.contributorGui.setText("");
				}

				height += 1;
				this.hook.size.y = height;
			},

			cycleTip() {
				// slide the first tip off the front
				const prevTipName = this.tipSequence.shift();
				if (prevTipName) {
					// then slide it onto the back of the previously shown tips
					this.shownTips.push(prevTipName);
					// if the backbuffer of tips we should avoid showing is too long...
					if (this.shownTips.length >= this.avoidShowingFor) {
						// get a random index
						const idx = this.getSequenceValue();
						// get the first tip from the backbuffer and add it to the sequence
						this.tipSequence.splice(idx, 0, this.shownTips.shift()!);
					}
				}

				// scan through the sequence of tips for a tip that can be shown
				for (let idx = 0; idx < this.tipSequence.length; idx++) {
					const nextTip = codetriangle.tt.model.tips.get(this.tipSequence[idx]);
					if (nextTip && codetriangle.tt.model.evaluateTipCondition(nextTip)) {
						this.setTip(nextTip);
						// get all of the elements we scanned through before finding our candidate...
						const scannedElements = this.tipSequence.splice(0, idx);
						// and push them to the end of the sequence
						this.tipSequence.splice(this.tipSequence.length, 0, ...scannedElements);
						return;
					}
				}

				// if we get here, there are no eligible tips in the sequence.
				// instead, we will raid the already recently shown tips.
				for (let idx = 0; idx < this.shownTips.length; idx++) {
					const nextTip = codetriangle.tt.model.tips.get(this.shownTips[idx]);
					if (nextTip && codetriangle.tt.model.evaluateTipCondition(nextTip)) {
						this.setTip(nextTip);
						// get this element...
						const scannedElements = this.shownTips.splice(idx, 1);
						// and push it to the start of the tip sequence
						this.tipSequence.splice(0, 0, ...scannedElements);
						return;
					}
				}

				// if we get all the way here then oh well. guess it didn't work. so don't change it.
			},

			addTipStateListener(listener) {
				this.listeners.push(listener);
			},

			show() {
				if (this.currentTip === undefined) {
					this.cycleTip();
				}
				this.refreshTimer = this.refreshInterval;
				this.titleGui.doStateTransition("DEFAULT", false, false, null, 0.075);
				this.bodyGui.doStateTransition("DEFAULT");
				this.contributorGui.doStateTransition("DEFAULT", false, false, null, 0.150);
				for (const listener of this.listeners) {
					listener.onTipGuiShow?.(this);
				}
			},

			hide() {
				this.titleGui.doStateTransition("HIDDEN");
				this.bodyGui.doStateTransition("HIDDEN");
				this.contributorGui.doStateTransition("HIDDEN");
				for (const listener of this.listeners) {
					listener.onTipGuiHide?.(this);
				}
			},

			update() {
				if (this.refreshInterval == 0) {
					return;
				}
				this.refreshTimer -= ig.system.tick;
				if (this.refreshTimer <= 0) {
					this.hide();
					this.contributorGui.hook.stateCallback = () => {
						this.cycleTip();
						this.show();
					};

					// in case a deadline was missed once, don't call this repeatedly
					while (this.refreshTimer < 0) {
						this.refreshTimer += this.refreshInterval;
					}
				}
			},

			modelChanged(model, message, data) {
				if (model == codetriangle.tt.model) {
					if (message == codetriangle.tt.TIP_MODEL_MESSAGE.TIP_ADDED) {
						let key: string = (data as any).key;
						let ridx = this.getSequenceValue();
						this.tipSequence.splice(ridx, 0, key);
					}
				}
			},
		});

		ig.addGameAddon(() => codetriangle.tt.model = new codetriangle.tt.TipsAndTricksModel());

		sc.PauseScreenGui.inject({
			init() {
				this.parent();
				this.tipsGui = new codetriangle.tt.TipsAndTricksGui();
				this.tipsBoxGui = new sc.SlickBoxGui(this.tipsGui, false, 6, 2);
				this.tipsBoxGui.hook.transitions = {
					DEFAULT: {
						state: {},
						time: 0.25,
						timeFunction: KEY_SPLINES.LINEAR,
					},
					HIDDEN: {
						state: { alpha: 0 },
						time: 0.25,
						timeFunction: KEY_SPLINES.LINEAR,
					}
				}
				this.tipsBoxGui.setPos(0, 3);
				this.addChildGui(this.tipsBoxGui);
				this.tipsGui.addTipStateListener(this);
			},

			onTipGuiShow(gui) {
				this.tipsBoxGui.setContent(gui);
				this.tipsBoxGui.doStateTransition("DEFAULT");
			},

			onTipGuiHide(gui) {
				this.tipsBoxGui.doStateTransition("HIDDEN");
			},

			modelChanged(model: any, msg: number, data: any) {
				this.parent(model, msg, data);
				if (
					model == sc.model &&
					msg == sc.GAME_MODEL_MSG.SUB_STATE_CHANGED &&
					!sc.model.isReset() &&
					sc.model.currentSubState != sc.GAME_MODEL_SUBSTATE.MENU
				) {
					var paused = sc.menu.directMode ? true : sc.model.isPaused();
					if (paused) {
						this.tipsGui.show();
					} else {
						this.tipsGui.hide();
					}
				}
			}
		});
	}
}
