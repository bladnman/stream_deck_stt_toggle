export interface SttAdapter {
	readonly name: string;
	readonly key: string;
	readonly defaultShortcut: string;
	activate(shortcut?: string): Promise<void>;
	deactivate(shortcut?: string): Promise<void>;
	isRecording(): Promise<boolean>;
	isAvailable(): Promise<boolean>;
}
