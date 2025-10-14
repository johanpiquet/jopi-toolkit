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

export function getErrorMessage(e: unknown): string {
    if (e instanceof Error) return e.message;
    return "" + e;
}

export function applyDefaults<T>(source: T|undefined, defaults: T): T {
    if (!source) source = {} as T;
    return {...defaults, ...source};
}