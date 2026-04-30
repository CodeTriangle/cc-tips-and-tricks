export {};

declare global {
	namespace codetriangle.tt {
		interface TipsAndTricksModel extends ig.GameAddon {
		}

		namespace TipsAndTricksGui {
			interface Config {
				refreshInterval?: number
			}
		}

		interface TipsAndTricksGui extends ig.GuiElementBase {
		}

		interface TipsAndTricksGuiConstructor extends ImpactClass<TipsAndTricksGui> {
			new (config?: TipsAndTricksGui.Config): TipsAndTricksGui;
		}

		var TipsAndTricksGui: TipsAndTricksGuiConstructor;
	}

	namespace sc {
		interface LoadingScreenGui {
		}
	}
}

