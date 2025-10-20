export let gIsUsingWorkers = false;

export function declareUsingWorker() {
    gIsUsingWorkers = true;
}

export function isUsingWorker(): boolean {
    return gIsUsingWorkers;
}