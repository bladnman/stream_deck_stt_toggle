import streamDeck, {
	action,
	type DialDownEvent,
	type DidReceiveSettingsEvent,
	type KeyDownEvent,
	SingletonAction,
	type WillAppearEvent,
	type WillDisappearEvent,
} from "@elgato/streamdeck";

import { appendFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { getAdapter } from "../adapters/registry";
import { renderStateImage } from "../rendering/svg-renderer";
import type { ButtonState, SttToggleSettings } from "../types/settings";
import { buildShortcutString, DEFAULT_SETTINGS } from "../types/settings";

const logger = streamDeck.logger.createScope("SttToggle");
const DEBUG_LOG = join(homedir(), "voxdeck-debug.log");
function debugLog(msg: string): void {
	const line = `[${new Date().toISOString()}] ACTION: ${msg}\n`;
	try { appendFileSync(DEBUG_LOG, line); } catch { /* ignore */ }
}

// Per-action-instance polling timers and cached state
const pollingTimers = new Map<string, ReturnType<typeof setInterval>>();
const lastStates = new Map<string, ButtonState>();
// Grace period: after toggle, trust the optimistic state for a few seconds
const toggleGraceUntil = new Map<string, number>();
// Guard against overlapping polls (lsof can take >1s)
const pollInFlight = new Set<string>();

const GRACE_PERIOD_MS = 4000;

@action({ UUID: "com.voxdeck.stt-toggle.toggle" })
export class SttToggleAction extends SingletonAction<SttToggleSettings> {

	override async onWillAppear(ev: WillAppearEvent<SttToggleSettings>): Promise<void> {
		debugLog(`onWillAppear raw settings: ${JSON.stringify(ev.payload.settings)}`);
		const settings = { ...DEFAULT_SETTINGS, ...ev.payload.settings };
		await this.updateDisplay(ev.action.id, ev.action, settings);
		this.startPolling(ev.action.id, ev.action, settings);
	}

	override onWillDisappear(ev: WillDisappearEvent<SttToggleSettings>): void {
		this.stopPolling(ev.action.id);
		lastStates.delete(ev.action.id);
		toggleGraceUntil.delete(ev.action.id);
		pollInFlight.delete(ev.action.id);
	}

	override async onKeyDown(ev: KeyDownEvent<SttToggleSettings>): Promise<void> {
		await this.toggle(ev.action.id, ev.action, { ...DEFAULT_SETTINGS, ...ev.payload.settings });
	}

	override async onDialDown(ev: DialDownEvent<SttToggleSettings>): Promise<void> {
		await this.toggle(ev.action.id, ev.action, { ...DEFAULT_SETTINGS, ...ev.payload.settings });
	}

	override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<SttToggleSettings>): Promise<void> {
		debugLog(`onDidReceiveSettings raw: ${JSON.stringify(ev.payload.settings)}`);
		const settings = { ...DEFAULT_SETTINGS, ...ev.payload.settings };
		this.stopPolling(ev.action.id);
		await this.updateDisplay(ev.action.id, ev.action, settings);
		this.startPolling(ev.action.id, ev.action, settings);
	}

	private async toggle(
		actionId: string,
		actionInstance: { setImage(image: string): Promise<void> },
		settings: SttToggleSettings,
	): Promise<void> {
		debugLog(`toggle called, app=${settings.sttApplication}`);
		const adapter = getAdapter(settings.sttApplication);
		if (!adapter) {
			debugLog(`no adapter for "${settings.sttApplication}"`);
			logger.error(`No adapter found for "${settings.sttApplication}"`);
			await this.showState(actionId, actionInstance, "error", settings);
			this.clearErrorAfter(actionId, actionInstance, settings);
			return;
		}

		try {
			const shortcut = buildShortcutString(settings) || settings.toggleShortcut || adapter.defaultShortcut;
			const lastState = lastStates.get(actionId) ?? "idle";

			// Send the hotkey immediately — don't wait for isRecording() first.
			// Optimistically flip the display; polling will correct if needed.
			// Set a grace period so polling doesn't override the optimistic state.
			toggleGraceUntil.set(actionId, Date.now() + GRACE_PERIOD_MS);

			if (lastState === "recording") {
				await adapter.deactivate(shortcut);
				await this.showState(actionId, actionInstance, "idle", settings);
			} else {
				const available = await adapter.isAvailable();
				if (!available) {
					toggleGraceUntil.delete(actionId);
					await this.showState(actionId, actionInstance, "unavailable", settings);
					return;
				}
				await adapter.activate(shortcut);
				await this.showState(actionId, actionInstance, "recording", settings);
			}
		} catch (err) {
			logger.error(`Toggle failed: ${err}`);
			toggleGraceUntil.delete(actionId);
			await this.showState(actionId, actionInstance, "error", settings);
			this.clearErrorAfter(actionId, actionInstance, settings);
		}
	}

	private async updateDisplay(
		actionId: string,
		actionInstance: { setImage(image: string): Promise<void> },
		settings: SttToggleSettings,
	): Promise<void> {
		// Skip polling during grace period after toggle
		const graceEnd = toggleGraceUntil.get(actionId);
		if (graceEnd && Date.now() < graceEnd) {
			debugLog(`updateDisplay: in grace period, skipping`);
			return;
		}
		toggleGraceUntil.delete(actionId);

		const adapter = getAdapter(settings.sttApplication);
		if (!adapter) {
			debugLog(`updateDisplay: no adapter for "${settings.sttApplication}"`);
			await this.showState(actionId, actionInstance, "unavailable", settings);
			return;
		}

		try {
			const available = await adapter.isAvailable();
			if (!available) {
				debugLog(`updateDisplay: not available`);
				await this.showState(actionId, actionInstance, "unavailable", settings);
				return;
			}

			const recording = await adapter.isRecording();
			debugLog(`updateDisplay: recording=${recording}`);
			await this.showState(actionId, actionInstance, recording ? "recording" : "idle", settings);
		} catch (err) {
			logger.error(`Display update failed: ${err}`);
			await this.showState(actionId, actionInstance, "error", settings);
		}
	}

	private async showState(
		actionId: string,
		actionInstance: { setImage(image: string): Promise<void> },
		state: ButtonState,
		settings: SttToggleSettings,
	): Promise<void> {
		if (lastStates.get(actionId) === state) return;
		lastStates.set(actionId, state);

		const image = renderStateImage(state, settings);
		await actionInstance.setImage(image);
	}

	private startPolling(
		actionId: string,
		actionInstance: { setImage(image: string): Promise<void> },
		settings: SttToggleSettings,
	): void {
		this.stopPolling(actionId);

		const interval = Math.max(500, Math.min(5000, settings.pollingInterval));
		const timer = setInterval(async () => {
			// Don't start a new poll if the previous one is still running
			if (pollInFlight.has(actionId)) {
				debugLog(`poll skipped: previous still in flight`);
				return;
			}
			pollInFlight.add(actionId);
			try {
				await this.updateDisplay(actionId, actionInstance, settings);
			} catch (err) {
				logger.error(`Polling error: ${err}`);
			} finally {
				pollInFlight.delete(actionId);
			}
		}, interval);

		pollingTimers.set(actionId, timer);
	}

	private stopPolling(actionId: string): void {
		const timer = pollingTimers.get(actionId);
		if (timer) {
			clearInterval(timer);
			pollingTimers.delete(actionId);
		}
	}

	private clearErrorAfter(
		actionId: string,
		actionInstance: { setImage(image: string): Promise<void> },
		settings: SttToggleSettings,
	): void {
		setTimeout(() => {
			lastStates.delete(actionId);
			this.updateDisplay(actionId, actionInstance, settings).catch((err) => {
				logger.error(`Error recovery failed: ${err}`);
			});
		}, 2000);
	}
}
