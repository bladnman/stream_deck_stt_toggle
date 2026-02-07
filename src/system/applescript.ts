import { execFile } from "node:child_process";

const TIMEOUT_MS = 5000;

export function runAppleScript(script: string): Promise<string> {
	return new Promise((resolve, reject) => {
		execFile("osascript", ["-e", script], { timeout: TIMEOUT_MS }, (error, stdout, stderr) => {
			if (error) {
				reject(new Error(`AppleScript error: ${stderr || error.message}`));
			} else {
				resolve(stdout.trim());
			}
		});
	});
}

const MODIFIER_MAP: Record<string, string> = {
	cmd: "command down",
	command: "command down",
	ctrl: "control down",
	control: "control down",
	alt: "option down",
	option: "option down",
	shift: "shift down",
};

const KEY_CODE_MAP: Record<string, number> = {
	f1: 122,
	f2: 120,
	f3: 99,
	f4: 118,
	f5: 96,
	f6: 97,
	f7: 98,
	f8: 100,
	f9: 101,
	f10: 109,
	f11: 103,
	f12: 111,
	f13: 105,
	f14: 107,
	f15: 113,
	f16: 106,
	f17: 64,
	f18: 79,
	f19: 80,
	f20: 90,
	space: 49,
	escape: 53,
	return: 36,
	tab: 48,
	delete: 51,
};

export function pressKeyboardShortcut(shortcut: string): Promise<void> {
	const parts = shortcut.toLowerCase().split("+").map((s) => s.trim());
	const key = parts.pop()!;
	const modifiers = parts
		.map((m) => MODIFIER_MAP[m])
		.filter(Boolean);

	let script: string;
	const keyCode = KEY_CODE_MAP[key];

	if (keyCode !== undefined) {
		const modifierList = modifiers.length > 0 ? ` using {${modifiers.join(", ")}}` : "";
		script = `tell application "System Events" to key code ${keyCode}${modifierList}`;
	} else if (key.length === 1) {
		const modifierList = modifiers.length > 0 ? ` using {${modifiers.join(", ")}}` : "";
		script = `tell application "System Events" to keystroke "${key}"${modifierList}`;
	} else {
		throw new Error(`Unknown key: "${key}" in shortcut "${shortcut}"`);
	}

	return runAppleScript(script).then(() => undefined);
}
