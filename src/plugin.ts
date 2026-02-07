import streamDeck from "@elgato/streamdeck";

import { SttToggleAction } from "./actions/stt-toggle";
import { registerAdapter } from "./adapters/registry";
import { OtoAdapter } from "./adapters/oto";
import { SuperWhisperAdapter } from "./adapters/superwhisper";

// Register adapters
registerAdapter(new OtoAdapter());
registerAdapter(new SuperWhisperAdapter());

// Register actions
streamDeck.actions.registerAction(new SttToggleAction());

// Connect to Stream Deck
streamDeck.connect();
