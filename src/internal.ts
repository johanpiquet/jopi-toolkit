export let gIsUsingWorkers = false;

export function declareUsingWorker() {
    gIsUsingWorkers = true;
}

export function isUsingWorker(): boolean {
    return gIsUsingWorkers;
}

export function merge(target: any, source: any) {
    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            target[key] = source[key];
        }
    }
}