export let gIsUsingWorkers = false;
export function declareUsingWorker() {
    gIsUsingWorkers = true;
}
export function isUsingWorker() {
    return gIsUsingWorkers;
}
export function merge(target, source) {
    for (const key in source) {
        if (source.hasOwnProperty(key)) {
            target[key] = source[key];
        }
    }
}
//# sourceMappingURL=internal.js.map