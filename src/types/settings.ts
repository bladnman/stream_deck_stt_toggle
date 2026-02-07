export type ButtonState = "idle" | "recording" | "unavailable" | "error";

export type SttToggleSettings = {
	sttApplication: string;
	toggleShortcut: string;
	pollingInterval: number;
	recordingColor: string;
	idleColor: string;
	showRecLabel: boolean;
};

export const DEFAULT_SETTINGS: SttToggleSettings = {
	sttApplication: "superwhisper",
	toggleShortcut: "",
	pollingInterval: 1000,
	recordingColor: "#FF3333",
	idleColor: "#333333",
	showRecLabel: true,
};
