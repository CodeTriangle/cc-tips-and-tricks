export {};

declare global {
	namespace codetriangle.tt {
		enum TIP_MODEL_MESSAGE {
			TIP_ENABLE_STATUS_CHANGED,
		}

		namespace TipsAndTricksModel {
			interface Data {
				title?: string | ig.LangLabel.Data;
				body: string | ig.LangLabel.Data;
				contributor?: string | ig.LangLabel.Data;
			}
		}

		interface TipsAndTricksModel extends ig.GameAddon, sc.Model {
			tips: Map<string, TipsAndTricksModel.Data>;
			enabledTips: Set<string>;
			tipStatusUpdatedCallbacks: ((tip) => void)[];
			addTip(this: this, key: string, tip: TipsAndTricksModel.Data, enabled?: boolean);
			setTipEnabled(this: this, key: string, enabled: boolean);
			getRandomTip(this: this, ): TipsAndTricksModel.Data;
		}

		interface TipsAndTricksModelConstructor extends ImpactClass<TipsAndTricksModel> {
			new (): TipsAndTricksModel;
		}

		var TipsAndTricksModel: TipsAndTricksModelConstructor;

		var model: TipsAndTricksModel;

		namespace TipsAndTricksGui {
			interface Config {
				/// How often the tip display should automatically change tips
				refreshInterval?: number;
				/// The width of the UI element
				width?: number;
				/// How many tips should we wait before showing the same tip?
				avoidShowingFor?: number;
			}
		}

		interface TipsAndTricksGui extends ig.GuiElementBase, sc.Model.Observer {
			refreshInterval: number;
			refreshTimer: number;

			avoidShowingFor: number;

			tipSequence: string[];

			titleGui: sc.TextGui;
			bodyGui: sc.TextGui;
			contributorGui: sc.TextGui;

			getSequenceValue(this: this): number;

			setTip(this: this, tip: TipsAndTricksModel.Data): void;
			setRandomTip(this: this): void;
			cycleTip(this: this): void;
		}

		interface TipsAndTricksGuiConstructor extends ImpactClass<TipsAndTricksGui> {
			new (config?: TipsAndTricksGui.Config): TipsAndTricksGui;
		}

		var TipsAndTricksGui: TipsAndTricksGuiConstructor;
	}

	namespace sc {
		interface PauseScreenGui {
			tipsGui: codetriangle.tt.TipsAndTricksGui;
			tipsBoxGui: sc.SlickBoxGui;
			modelChanged: (this: this, model: any, msg: number, data: any) => void;
		}
	}
}

