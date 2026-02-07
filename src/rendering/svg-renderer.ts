import type { ButtonState, SttToggleSettings } from "../types/settings";
import { renderButtonSvg } from "./templates";

export function renderStateImage(state: ButtonState, settings: SttToggleSettings): string {
	const svg = renderButtonSvg({
		state,
		idleColor: settings.idleColor,
		recordingColor: settings.recordingColor,
		showRecLabel: settings.showRecLabel,
	});

	return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
