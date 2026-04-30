export default class TipsAndTricks {
	constructor(mod: modloader.Mod) {
	}

	async prestart() {
		// @ts-expect-error
		window.codetriangle ??= {};
		// @ts-expect-error
		window.codetriangle.tt ??= {};

		codetriangle.tt.TIP_MODEL_MESSAGE = {
			TIP_ENABLE_STATUS_CHANGED: 0,
		}

		codetriangle.tt.TipsAndTricksModel = ig.GameAddon.extend({
			init() {
				this.observers = [];
				this.tips = new Map();
				this.enabledTips = new Set();

				for (let i = 0; i < 10; i++) {
					this.addTip(`example1${i}`, {
						title: "Example title",
						body: `Example body ${i}`,
						contributor: "Example contributor",
					});
				}
			},

			addTip(key, tip, enabled) {
				if (this.tips.has(key)) {
					throw new Error(`Tip already exists: ${key}`);
				}
				this.tips.set(key, tip);

				this.setTipEnabled(key, enabled ?? true);
			},

			setTipEnabled(key, enabled) {
				if (!this.tips.has(key)) {
					throw new Error(`Tip does not exist: ${key}`);
				}

				let send = false;
				if (enabled && !this.enabledTips.has(key)) {
					this.enabledTips.add(key);
					send = true;
				} else if (!enabled && this.enabledTips.has(key)) {
					this.enabledTips.delete(key);
					send = true;
				}

				if (send) {
					sc.Model.notifyObserver(
						this,
						codetriangle.tt.TIP_MODEL_MESSAGE.TIP_ENABLE_STATUS_CHANGED,
						{
							key: key,
							enabled: enabled,
						}
					);
				}
			},
		});

		codetriangle.tt.TipsAndTricksGui = ig.GuiElementBase.extend({
			init(config) {
				this.parent();
				this.refreshInterval = config?.refreshInterval ?? 5;
				this.avoidShowingFor = config?.avoidShowingFor ?? 5;
				this.titleGui = new sc.TextGui("", {font: sc.fontsystem.smallFont});
				this.bodyGui = new sc.TextGui("", {font: sc.fontsystem.font, maxWidth: config?.width ?? 220});
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

				this.bodyGui.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_TOP);
				this.contributorGui.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_BOTTOM);

				this.addChildGui(this.titleGui);
				this.addChildGui(this.bodyGui);
				this.addChildGui(this.contributorGui);

				this.titleGui.doStateTransition("HIDDEN", true);
				this.bodyGui.doStateTransition("HIDDEN", true);
				this.contributorGui.doStateTransition("HIDDEN", true);

				this.tipSequence = Array.from(codetriangle.tt.model.enabledTips);
				// shuffle the array
				for (let i = 0; i < this.tipSequence.length; i++) {
					let ridx = Math.floor(Math.random() * this.tipSequence.length);

					let tmp = this.tipSequence[i];
					this.tipSequence[i] = this.tipSequence[ridx];
					this.tipSequence[ridx] = tmp;
				}
				this.cycleTip();

				sc.Model.addObserver(codetriangle.tt.model, this);
			},

			getSequenceValue() {
				if (this.tipSequence.length <= this.avoidShowingFor + 1) {
					return this.tipSequence.length;
				} else {
					return Math.floor(Math.random() * (this.tipSequence.length - this.avoidShowingFor)) + this.avoidShowingFor;
				}
			},

			setTip(tip) {
				let height = 0;
				if (tip.title) {
					this.titleGui.setText(tip.title);
					height += this.titleGui.hook.size.y;
					this.bodyGui.hook.pos.y = 12;
				} else {
					this.bodyGui.hook.pos.y = 0;
				}
				this.bodyGui.setText(tip.body);
				height += this.bodyGui.hook.size.y;
				if (tip.contributor) {
					this.contributorGui.setText(tip.contributor);
					height += this.contributorGui.hook.size.y;
				}
				height -= 1;
				this.hook.size.y = height;
			},

			setRandomTip() {
				this.setTip(codetriangle.tt.model.getRandomTip());
			},

			cycleTip() {
				const prevTip = this.tipSequence.shift();
				if (prevTip) {
					const idx = this.getSequenceValue();
					this.tipSequence.splice(idx, 0, prevTip);
				}

				const nextTip = codetriangle.tt.model.tips.get(this.tipSequence[0]);
				if (nextTip) {
					this.setTip(nextTip);
				}
			},

			show() {
				this.refreshTimer = this.refreshInterval;
				this.titleGui.doStateTransition("DEFAULT", false, false, null, 0.075);
				this.bodyGui.doStateTransition("DEFAULT");
				this.contributorGui.doStateTransition("DEFAULT", false, false, null, 0.150);
			},

			hide() {
				this.titleGui.doStateTransition("HIDDEN");
				this.bodyGui.doStateTransition("HIDDEN");
				this.contributorGui.doStateTransition("HIDDEN");
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
					if (message == codetriangle.tt.TIP_MODEL_MESSAGE.TIP_ENABLE_STATUS_CHANGED) {
						let key: string = (data as any).key;
						let enabled: string = (data as any).enabled;
						if (enabled) {
							// if we are enabling a new key, then add it to a random place in the list...
							let ridx = this.getSequenceValue();
							this.tipSequence.splice(ridx, 0, key);
						} else {
							// otherwise, remove it
							let idx = this.tipSequence.findIndex(v => v == key);
							if (idx != -1) {
								this.tipSequence.splice(idx, 1);
							}
						}
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
				this.tipsBoxGui.setPos(0, 3);
				this.addChildGui(this.tipsBoxGui);
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
