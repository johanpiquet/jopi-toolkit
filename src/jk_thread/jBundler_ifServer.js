import { isMainThread as nodeIsMainThread, parentPort, workerData } from "node:worker_threads";
import { Worker as NodeWorker } from "node:worker_threads";
import { declareUsingWorker } from "./common.ts";
export var isMainThread = nodeIsMainThread;
export var currentWorker = parentPort;
export var getCurrentWorkerData = function () { return workerData; };
export function newWorker(fileName, data) {
    declareUsingWorker();
    var res = data ?
        new NodeWorker(fileName, { workerData: data }) :
        new NodeWorker(fileName);
    return res;
}
export function unrefThisWorker(worker) {
    worker.unref();
}
export function closeCurrentThread() {
    if (parentPort) {
        parentPort.close();
    }
}
