export type ButtonState = "idle" | "recording" | "unavailable" | "error";

export type SttToggleSettings = {
	sttApplication: string;
	toggleShortcut: string; // legacy composite string, kept for backward compat
	shortcutKey: string;
	shortcutCtrl: boolean;
	shortcutAlt: boolean;
	shortcutCmd: boolean;
	shortcutShift: boolean;
	pollingInterval: number;
	recordingColor: string;
	idleColor: string;
	showRecLabel: boolean;
};

export const DEFAULT_SETTINGS: SttToggleSettings = {
	sttApplication: "superwhisper",
	toggleShortcut: "",
	shortcutKey: "",
	shortcutCtrl: false,
	shortcutAlt: false,
	shortcutCmd: false,
	shortcutShift: false,
	pollingInterval: 1000,
	recordingColor: "#FF3333",
	idleColor: "#333333",
	showRecLabel: true,
};

/** Build a shortcut string like "ctrl+alt+o" from the individual settings fields. */
export function buildShortcutString(settings: SttToggleSettings): string {
	const parts: string[] = [];
	if (settings.shortcutCtrl) parts.push("ctrl");
	if (settings.shortcutAlt) parts.push("alt");
	if (settings.shortcutCmd) parts.push("cmd");
	if (settings.shortcutShift) parts.push("shift");

	const key = settings.shortcutKey?.trim().toLowerCase();
	if (key) parts.push(key);

	return parts.join("+");
}
