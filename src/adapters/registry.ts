import type { SttAdapter } from "./types";

const adapters = new Map<string, SttAdapter>();

export function registerAdapter(adapter: SttAdapter): void {
	adapters.set(adapter.key, adapter);
}

export function getAdapter(key: string): SttAdapter | undefined {
	return adapters.get(key);
}

export function getAdapterList(): { key: string; name: string }[] {
	return Array.from(adapters.values()).map((a) => ({ key: a.key, name: a.name }));
}
