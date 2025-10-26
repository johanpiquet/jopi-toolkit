import {fileURLToPath} from "node:url";

export function generateUUIDv4(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

export function isUUIDv4(text: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text);
}

export function getErrorMessage(e: unknown): string {
    if (e instanceof Error) return e.message;
    return "" + e;
}

export function applyDefaults<T>(source: T|undefined, defaults: T): T {
    if (!source) source = {} as T;
    return {...defaults, ...source};
}

/**
 * Allow knowing the file path of the function calling us.
 */
export function getCallerFilePath(): string|undefined {
    try {
        throw new Error("");
    } catch (e: any) {
        let error: Error = e;

        if (!error.stack) return undefined;

        const stackLines = error.stack.split('\n');
        if (stackLines.length < 4) return undefined;

        // Here we have something like:
        // at file:///Users/johan/Projets/jopi-rewrite-workspace/__tests/jopi-ui-sample/dist/mod_sample/routes/tests/test3.page.js:4:1
        //
        let filePath = stackLines[3].trim();

        let idx = filePath.indexOf("file://");
        filePath = filePath.substring(idx);

        idx = filePath.lastIndexOf(":");
        filePath = filePath.substring(0, idx);

        idx = filePath.lastIndexOf(":");
        if (idx!==-1) filePath = filePath.substring(0, idx);

        filePath = fileURLToPath(filePath);
        return filePath;
    }

    // Never happen.
    return "";
}