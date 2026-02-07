import { readdir, access } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

import type { SttAdapter } from "./types";
import { pressKeyboardShortcut } from "../system/applescript";
import { isProcessRunning } from "../system/process";

const PROCESS_NAME = "superwhisper";
const RECORDINGS_DIR = join(homedir(), "Documents", "superwhisper", "recordings");

export class SuperWhisperAdapter implements SttAdapter {
	readonly name = "SuperWhisper";
	readonly key = "superwhisper";
	readonly defaultShortcut = "f4";

	async activate(shortcut?: string): Promise<void> {
		await pressKeyboardShortcut(shortcut || this.defaultShortcut);
	}

	async deactivate(shortcut?: string): Promise<void> {
		await pressKeyboardShortcut(shortcut || this.defaultShortcut);
	}

	async isRecording(): Promise<boolean> {
		// Find the newest recording folder (numeric timestamp names).
		// If it contains output.wav but no meta.json, recording is in progress.
		try {
			const entries = await readdir(RECORDINGS_DIR);
			const numeric = entries.filter((e) => /^\d+$/.test(e)).sort();
			if (numeric.length === 0) return false;

			const latest = join(RECORDINGS_DIR, numeric[numeric.length - 1]);
			const hasWav = await fileExists(join(latest, "output.wav"));
			const hasMeta = await fileExists(join(latest, "meta.json"));

			return hasWav && !hasMeta;
		} catch {
			return false;
		}
	}

	async isAvailable(): Promise<boolean> {
		return isProcessRunning(PROCESS_NAME);
	}
}

function fileExists(path: string): Promise<boolean> {
	return access(path).then(() => true, () => false);
}
