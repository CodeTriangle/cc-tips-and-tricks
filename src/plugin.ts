export default class TipsAndTricks {
	constructor(mod: modloader.Mod) {
	}

	async prestart() {
		// @ts-expect-error
		window.codetriangle ??= {};
		// @ts-expect-error
		window.codetriangle.tt ??= {};
		codetriangle.tt.TipsAndTricksGui
		sc.LoadingScreenGui.inject({
			init() {
			}
		});
	}
}
