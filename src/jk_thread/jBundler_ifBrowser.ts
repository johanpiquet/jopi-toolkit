import {declareUsingWorker} from "./common.ts";

export const isMainThread = true;
export const currentWorker = null;

export function getCurrentWorkerData() {}
export function unrefThisWorker() {}

export function newWorker(fileName: string) {
    declareUsingWorker();
    return new Worker(fileName, {type: 'module'})
}

export function closeCurrentThread() {
    if (self.close) {
        self.close();
    }
}