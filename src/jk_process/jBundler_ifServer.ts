import * as inspector from "node:inspector";

export const argv = process.argv;
export const env = process.env as Record<string, string>;
export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment: boolean = !isProduction;

/**
 * Detect if Node.js or Bun.js is running with the debugger launcher.
 */
export function isLaunchedWithDebugger(): boolean {
    const args = process.execArgv;
    if (args.some((arg) => arg.includes("--inspect") || arg.includes("--debug") || arg.includes("bootloader.js"))) return true;

    // Check environment variables
    if (process.env.VSCODE_INSPECTOR_OPTIONS) return true;
    
    if (process.env.NODE_OPTIONS) {
        const nodeOptions = process.env.NODE_OPTIONS;
        if (nodeOptions.includes("--inspect") || 
            nodeOptions.includes("--debug") || 
            nodeOptions.includes("bootloader.js") || 
            nodeOptions.includes("js-debug")) {
            return true;
        }
    }

    // Check Bun environment variables
    if (process.env.BUN_INSPECT || process.env.BUN_INSPECT_BRK || process.env.BUN_INSPECT_WAIT) return true;


    // Check inspector url. This is the most reliable way to detect if a debugger is attached.
    try {
        if (inspector.url()) return true;
    } catch { /* ignore */ }

    return false;
}