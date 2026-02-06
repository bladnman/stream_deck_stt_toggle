# VoxDeck — Stream Deck Speech-to-Text Toggle Plugin

## Product Requirements Document

**Author:** Matt (Metal Sole) **Date:** February 6, 2026 **Status:** Draft

---

## What Is This?

VoxDeck is a Stream Deck plugin that gives you a physical, always-visible toggle for your speech-to-text application. Press a button to activate recording, see it turn red, press again to stop. The button reflects the real state of your STT app at all times — even if you toggled recording from outside the Stream Deck.

The initial implementation targets **SuperWhisper** on macOS. The architecture, however, treats the STT application as a swappable adapter behind a common interface, so the same plugin can later support WhisperFlow, Whisper+, or any other speech-to-text tool without rebuilding the core button behavior, visual feedback, or settings infrastructure.

---

## Why Build This?

Speech-to-text tools are increasingly central to how creators and engineers work, but they all share the same UX gap: there's no persistent, glanceable indicator of recording state. You're left checking a tiny menu bar icon or remembering whether you hit the keyboard shortcut. When you're deep in a workflow — editing video, writing code, running a meeting — that ambiguity creates friction.

A Stream Deck button solves this by turning recording state into something physical and visible. Red means recording. Not-red means not recording. No guessing.

Building this as an abstracted, adapter-based plugin (rather than a hardcoded SuperWhisper macro) means the investment pays forward. As STT tools evolve or as you switch between them, the plugin adapts. The button behavior, visual language, and user experience stay consistent — only the detection and activation layer changes.

---

## Core Concepts

### The Adapter Model

The plugin is structured around a clean separation between two concerns:

**The Button System** handles everything the user sees and touches: visual states, press behavior, feedback animations, settings UI, and periodic state-sync polling. This never changes regardless of which STT app is being controlled.

**The STT Adapter** handles everything specific to a given speech-to-text application: how to activate/deactivate recording, how to detect whether recording is currently active, and any app-specific quirks. Each supported STT app gets its own adapter that implements a common interface.

The adapter interface is intentionally minimal:

- **activate()** — Start recording (fire the app's keyboard shortcut, CLI command, or API call)
- **deactivate()** — Stop recording
- **isRecording()** — Query current recording state (returns true/false)
- **isAvailable()** — Check if the STT app is running/installed

### State Detection

This is the hardest problem per-adapter. Each STT app exposes its state differently (or barely at all). Possible detection strategies include:

- Polling a menu bar icon's accessibility properties via AppleScript
- Checking for a specific process or process flag
- Reading a state file if the app writes one
- Monitoring system audio input usage
- Hitting a local API if the app provides one

The adapter for each app encapsulates whichever strategy works. The button system doesn't care how the adapter figures it out — it just calls `isRecording()` on an interval and updates the display accordingly.

### Visual States

The button communicates four possible states:


| State           | Button Visual                                   | Meaning                                |
| --------------- | ----------------------------------------------- | -------------------------------------- |
| **Idle**        | Default icon, neutral color                     | STT app is available, not recording    |
| **Recording**   | Red background, pulsing mic icon or "REC" label | Actively recording                     |
| **Unavailable** | Dimmed/grayed icon                              | STT app is not running or not detected |
| **Error**       | Yellow/amber flash                              | Activation attempted but failed        |


All visuals are rendered as dynamic SVGs pushed via `setImage`, allowing full control over color, iconography, and text without requiring pre-baked image assets.

---

## User Experience

### First Use

1. User installs the plugin from Stream Deck
2. Drags the "STT Toggle" action onto a button
3. In the Property Inspector (settings panel), selects their STT application from a dropdown — initially just "SuperWhisper," with the list growing as adapters are added
4. Optionally configures polling interval (default: 1 second) and visual preferences
5. Button immediately reflects the current state of the selected STT app

### Ongoing Use

- **Press button** → toggles recording on/off
- **Button color updates** → reflects actual recording state, synced via polling
- **If STT app quits** → button automatically transitions to "Unavailable" state
- **If STT app launches** → button automatically transitions to "Idle" state

### Dial Support (Stream Deck+)

For devices with dials/encoders, the touch display strip can show:

- Current STT app name and status
- Recording duration (if active)
- Push-to-toggle behavior (same as button press)

This is a secondary priority but the architecture should accommodate it.

---

## SuperWhisper Adapter (v1)

The first adapter targets SuperWhisper on macOS.

**Activation/Deactivation:** Fire SuperWhisper's global keyboard shortcut via AppleScript/System Events. The specific shortcut is user-configurable in the Property Inspector (default: whatever SuperWhisper's default toggle is).

**State Detection:** This requires investigation during implementation. Candidate approaches, in order of preference:

1. Check if SuperWhisper exposes any AppleScript dictionary or accessibility properties that indicate recording state
2. Monitor the system microphone — if SuperWhisper is the active audio input consumer, it's likely recording
3. Watch for a SuperWhisper-specific process or window state change
4. Fall back to optimistic toggle tracking (assume the shortcut worked, track state internally) with periodic re-sync attempts

**Availability Check:** Confirm SuperWhisper process is running via `pgrep` or equivalent.

---

## Settings (Property Inspector)


| Setting          | Type              | Default              | Notes                                               |
| ---------------- | ----------------- | -------------------- | --------------------------------------------------- |
| STT Application  | Dropdown          | SuperWhisper         | Selects which adapter to use                        |
| Toggle Shortcut  | Hotkey capture    | App-specific default | The keyboard shortcut that toggles the selected app |
| Polling Interval | Slider (500ms–5s) | 1000ms               | How often to check recording state                  |
| Recording Color  | Color picker      | #FF3333              | Button background when recording                    |
| Idle Color       | Color picker      | #333333              | Button background when idle                         |
| Show "REC" Label | Toggle            | On                   | Whether to overlay text on the recording state      |


---

## Future Adapters

Each new adapter requires implementing the four-method interface (activate, deactivate, isRecording, isAvailable) and adding an entry to the application dropdown. Anticipated candidates:

- **WhisperFlow** — likely keyboard-shortcut driven, similar to SuperWhisper
- **Whisper+** — TBD based on how it exposes state
- **macOS Dictation** — system-level, may use accessibility APIs
- **Custom/Generic** — a "bring your own shortcut" adapter that just fires a configurable hotkey and tracks state optimistically, for any app without a dedicated adapter

---

## Technical Notes

- **SDK:** Elgato Stream Deck SDK (TypeScript/Node.js)
- **Platform:** macOS initially (Windows adapters could follow but system integration will differ significantly)
- **Runtime:** Node.js with `child_process` for AppleScript/shell execution
- **Button rendering:** Dynamic SVG via `setImage` for maximum visual flexibility
- **State architecture:** Polling-based with configurable interval; event-driven detection can be added per-adapter if an app supports it
- **Manifest:** Action should declare both `Keypad` and `Encoder` controllers to support buttons and dials on Stream Deck+

---

## What's Out of Scope (For Now)

- Windows support (macOS-first, system integration strategies differ too much to abstract cleanly upfront)
- Multi-button layouts (e.g., separate start/stop buttons) — single toggle is the right UX
- Transcription display on the Stream Deck — the button shows state, not content
- Integration with the transcribed text output (clipboard, file, etc.)
- Marketplace publishing — build for personal use first, polish for distribution later

---

## Success Criteria

The plugin is successful when:

1. You can press a Stream Deck button and reliably toggle SuperWhisper recording
2. The button visually reflects actual recording state within the polling interval
3. The button recovers gracefully when SuperWhisper isn't running
4. Swapping to a new STT adapter requires only implementing the four-method interface — zero changes to button logic, visual system, or settings infrastructure

