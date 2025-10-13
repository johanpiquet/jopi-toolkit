import {isMainThread as nodeIsMainThread, parentPort, workerData} from "node:worker_threads";
import {Worker as NodeWorker} from "node:worker_threads";
import {declareUsingWorker} from "./common.ts";


export const isMainThread = nodeIsMainThread;
export const currentWorker = parentPort as unknown as Worker;
export const getCurrentWorkerData = () => workerData;

export function newWorker(fileName: string, data?: any) {
    declareUsingWorker();

    const res = data ?
        new NodeWorker(fileName, {workerData: data}) :
        new NodeWorker(fileName);

    return res as unknown as Worker
}

export function unrefThisWorker(worker: Worker) {
    (worker as unknown as NodeWorker).unref();
}

export function closeCurrentThread() {
    if (parentPort) {
        parentPort.close();
    }
}
