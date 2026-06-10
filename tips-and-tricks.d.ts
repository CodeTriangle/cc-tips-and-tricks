export {};

declare global {
	namespace codetriangle.tt {
		enum TIP_MODEL_MESSAGE {
			TIP_ADDED,
		}

		namespace TipsAndTricksModel {
			type TextDataEntry = string | ig.LangLabel.Data;
			type DataEntry = TextDataEntry | (() => TextDataEntry);

			interface Data {
				title?: DataEntry;
				body: DataEntry;
				contributor?: DataEntry;
				condition?: string | ig.VarCondition | (() => bool);
			}
		}

		interface TipsAndTricksModel extends ig.GameAddon, sc.Model, ig.Loadable.LoadListener<TipDatabase> {
			tips: Map<string, TipsAndTricksModel.Data>;
			tipDatabase: TipDatabase;
			tipStatusUpdatedCallbacks: ((tip) => void)[];

			getLabel(entry: DataEntry): string;

			addTip(this: this, key: string, tip: TipsAndTricksModel.Data);
			addTips(this: this, tipObject: Record<string, TipsAndTricksModel.Data>): void;

			evaluateTipCondition(this: this, tip: TipsAndTricksModel.Data): boolean;
		}

		interface TipsAndTricksModelConstructor extends ImpactClass<TipsAndTricksModel> {
			new (): TipsAndTricksModel;
		}

		var TipsAndTricksModel: TipsAndTricksModelConstructor;

		var model: TipsAndTricksModel;

		interface TipDatabase extends ig.JsonLoadable {
			tips: Record<string, TipsAndTricksModel.Data>;
		}

		interface TipDatabaseConstructor extends ImpactClass<TipDatabase> {
			new(): TipDatabase;
		}

		var TipDatabase: TipDatabaseConstructor;

		namespace TipsAndTricksGui {
			interface Config {
				/// How often the tip display should automatically change tips
				refreshInterval?: number;
				/// The width of the UI element
				width?: number;
				/// How many tips should we wait before showing the same tip?
				avoidShowingFor?: number;
			}

			interface Listener {
				onTipGuiShow(this: this, gui: TipsAndTricksGui);
				onTipGuiHide(this: this, gui: TipsAndTricksGui);
			}
		}

		interface TipsAndTricksGui extends ig.GuiElementBase, sc.Model.Observer {
			listeners: TipsAndTricksGui.Listener[];

			refreshInterval: number;
			refreshTimer: number;

			avoidShowingFor: number;

			tipSequence: string[];
			shownTips: string[];

			currentTip: Optional<TipsAndTricksModel.Data>;

			titleGui: sc.TextGui;
			bodyGui: sc.TextGui;
			contributorGui: sc.TextGui;

			getSequenceValue(this: this): number;

			setTip(this: this, tip: TipsAndTricksModel.Data): void;
			cycleTip(this: this): void;

			addTipStateListener(this: this, listener: TipsAndTricksGui.Listener): void;
		}

		interface TipsAndTricksGuiConstructor extends ImpactClass<TipsAndTricksGui> {
			new (config?: TipsAndTricksGui.Config): TipsAndTricksGui;
		}

		var TipsAndTricksGui: TipsAndTricksGuiConstructor;
	}

	namespace sc {
		interface PauseScreenGui extends codetriangle.tt.TipsAndTricksGui.Listener {
			tipsGui: codetriangle.tt.TipsAndTricksGui;
			tipsBoxGui: sc.SlickBoxGui;
			modelChanged: (this: this, model: any, msg: number, data: any) => void;
		}
	}
}

