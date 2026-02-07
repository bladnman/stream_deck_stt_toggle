import type { ButtonState } from "../types/settings";

type RenderOptions = {
	state: ButtonState;
	idleColor: string;
	recordingColor: string;
	showRecLabel: boolean;
};

export function renderButtonSvg(options: RenderOptions): string {
	const { state, idleColor, recordingColor, showRecLabel } = options;

	let bgColor: string;
	let micColor: string;
	let micOpacity = 1;
	let labelText = "";
	let labelColor = "#FFFFFF";

	switch (state) {
		case "recording":
			bgColor = recordingColor;
			micColor = "#FFFFFF";
			if (showRecLabel) labelText = "REC";
			break;
		case "unavailable":
			bgColor = idleColor;
			micColor = "#888888";
			micOpacity = 0.5;
			break;
		case "error":
			bgColor = "#CC8800";
			micColor = "#FFFFFF";
			labelText = "ERR";
			break;
		case "idle":
		default:
			bgColor = idleColor;
			micColor = "#AAAAAA";
			break;
	}

	const labelSvg = labelText
		? `<text x="72" y="30" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="bold" fill="${labelColor}">${labelText}</text>`
		: "";

	// Mic capsule (filled), cradle arc, and stand
	// Shifted up to leave ~24px at the bottom for the Stream Deck native title
	const micSvg = `
	<g opacity="${micOpacity}" transform="translate(72, 68)" stroke-linecap="round" stroke-linejoin="round">
		<!-- Capsule body (filled) -->
		<ellipse cx="0" cy="-10" rx="18" ry="28" fill="${micColor}" stroke="none"/>
		<!-- Cradle arc -->
		<path d="M -28 0 C -28 18, -15 32, 0 32 C 15 32, 28 18, 28 0" fill="none" stroke="${micColor}" stroke-width="4.5"/>
		<!-- Stand -->
		<line x1="0" y1="32" x2="0" y2="42" stroke="${micColor}" stroke-width="4.5"/>
		<line x1="-12" y1="42" x2="12" y2="42" stroke="${micColor}" stroke-width="4.5"/>
	</g>`;

	return `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144">
	<rect width="144" height="144" rx="16" fill="${bgColor}"/>
	${micSvg}
	${labelSvg}
</svg>`;
}
