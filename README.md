# VoxDeck

A Stream Deck plugin that gives you a physical toggle button for speech-to-text applications. Press to start recording, press to stop. The button always reflects the real state of your STT app.

![macOS](https://img.shields.io/badge/platform-macOS%2013%2B-blue)
![Stream Deck](https://img.shields.io/badge/Stream%20Deck-SDK%20v2-black)
![Node.js](https://img.shields.io/badge/Node.js-20-green)

## Supported Applications

| Application | Detection Method | Default Shortcut |
|---|---|---|
| [SuperWhisper](https://superwhisper.com) | Filesystem (recording folder state) | `F4` |
| [oto](https://www.jfrech.com/oto) | Open file handle (`lsof`) | `Option+F4` |

Adding a new STT app is straightforward — implement the `SttAdapter` interface and register it.

## Features

- **Real-time state polling** — continuously checks whether the STT app is recording, idle, or unavailable
- **Dynamic button rendering** — SVG-based icons change color and show a "REC" label during recording
- **Customizable appearance** — pick your own recording/idle colors from the property inspector
- **Configurable shortcut** — override the default hotkey with any key + modifier combination
- **Adjustable polling interval** — tune from 500ms to 5000ms depending on your preference
- **Supports Keypad and Encoder** — works with both standard keys and dials

## Installation

### Prerequisites

- macOS 13.0+
- [Stream Deck](https://www.elgato.com/stream-deck) software 6.5+
- Node.js 20+ (for development)

### From Source

```bash
git clone https://github.com/bladnman/stream_deck_stt_toggle.git
cd stream_deck_stt_toggle
npm install
npm run build
```

Link the plugin to your Stream Deck app:

```bash
npx streamdeck link com.voxdeck.stt-toggle.sdPlugin
```

Then restart the plugin:

```bash
npx streamdeck restart com.voxdeck.stt-toggle
```

## Configuration

Once the action is placed on your Stream Deck, click it to open the property inspector:

| Setting | Description |
|---|---|
| **Application** | Which STT app to control (SuperWhisper or oto) |
| **Shortcut** | Key + modifiers to toggle recording (leave blank for app default) |
| **Polling** | How often to check recording state (500–5000ms) |
| **Recording color** | Background color when recording (default: red) |
| **Idle color** | Background color when idle (default: dark gray) |
| **Show REC label** | Display "REC" text on the button during recording |

## Development

```bash
npm run build          # one-time build
npm run watch          # rebuild on change + auto-restart plugin
```

### Project Structure

```
src/
  plugin.ts                 # entry point — registers adapters and actions
  actions/stt-toggle.ts     # Stream Deck action (key/dial handling, polling)
  adapters/
    types.ts                # SttAdapter interface
    registry.ts             # adapter registration
    superwhisper.ts         # SuperWhisper adapter
    oto.ts                  # oto adapter
  rendering/
    svg-renderer.ts         # state → SVG data URI
    templates.ts            # SVG template for button states
  system/
    applescript.ts          # keyboard shortcut via AppleScript
    process.ts              # process detection (pgrep)
  types/settings.ts         # settings types and defaults

com.voxdeck.stt-toggle.sdPlugin/
  manifest.json             # Stream Deck plugin manifest
  ui/stt-toggle.html        # property inspector UI
  imgs/                     # plugin and action icons
```

### Adding an Adapter

1. Create a new file in `src/adapters/` implementing `SttAdapter`:

```typescript
export interface SttAdapter {
  readonly name: string;
  readonly key: string;
  readonly defaultShortcut: string;
  activate(shortcut?: string): Promise<void>;
  deactivate(shortcut?: string): Promise<void>;
  isRecording(): Promise<boolean>;
  isAvailable(): Promise<boolean>;
}
```

2. Register it in `src/plugin.ts`
3. Add an `<option>` to the select in `ui/stt-toggle.html`

## Author

Matt Maher
