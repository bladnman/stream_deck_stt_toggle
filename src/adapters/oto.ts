import { execFile } from "node:child_process";
import { appendFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import streamDeck from "@elgato/streamdeck";

import type { SttAdapter } from "./types";
import { pressKeyboardShortcut } from "../system/applescript";
import { isProcessRunning } from "../system/process";

const logger = streamDeck.logger.createScope("OtoAdapter");

const PROCESS_NAME = "oto";
const LSOF_PATH = "/usr/sbin/lsof";
const DEBUG_LOG = join(homedir(), "voxdeck-debug.log");

function debugLog(msg: string): void {
	const line = `[${new Date().toISOString()}] ${msg}\n`;
	try { appendFileSync(DEBUG_LOG, line); } catch { /* ignore */ }
}

export class OtoAdapter implements SttAdapter {
	readonly name = "oto";
	readonly key = "oto";
	readonly defaultShortcut = "alt+f4";

	async activate(shortcut?: string): Promise<void> {
		await pressKeyboardShortcut(shortcut || this.defaultShortcut);
	}

	async deactivate(shortcut?: string): Promise<void> {
		await pressKeyboardShortcut(shortcut || this.defaultShortcut);
	}

	async isRecording(): Promise<boolean> {
		// oto creates a temp .wav file during recording and holds it open.
		// The file is deleted after recording completes.
		// Check if oto has any .wav file open via lsof.
		try {
			const result = await hasOpenWavHandle();
			debugLog(`isRecording: ${result}`);
			return result;
		} catch (err) {
			debugLog(`isRecording error: ${err}`);
			return false;
		}
	}

	async isAvailable(): Promise<boolean> {
		return isProcessRunning(PROCESS_NAME);
	}
}

function hasOpenWavHandle(): Promise<boolean> {
	return new Promise((resolve) => {
		execFile(LSOF_PATH, ["-c", PROCESS_NAME], { timeout: 3000, maxBuffer: 2 * 1024 * 1024 }, (error, stdout) => {
			if (error) {
				debugLog(`lsof -c error: ${error.message}`);
				resolve(false);
				return;
			}
			const found = stdout.includes(".wav");
			debugLog(`lsof -c oto: ${stdout.length} bytes, wav found: ${found}`);
			resolve(found);
		});
	});
}
