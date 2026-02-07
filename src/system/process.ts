import { execFile } from "node:child_process";

export function isProcessRunning(name: string): Promise<boolean> {
	return new Promise((resolve) => {
		execFile("pgrep", ["-x", name], { timeout: 3000 }, (error) => {
			resolve(error === null);
		});
	});
}

export function openUrl(url: string): Promise<void> {
	return new Promise((resolve, reject) => {
		execFile("open", [url], { timeout: 5000 }, (error) => {
			if (error) {
				reject(new Error(`Failed to open URL: ${error.message}`));
			} else {
				resolve();
			}
		});
	});
}
