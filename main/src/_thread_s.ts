import {isMainThread, parentPort, workerData} from "node:worker_threads";
import {declareUsingWorker} from "./internal";
import {Worker as NodeWorker} from "worker_threads";

export function patch_server() {
    NodeSpace.thread = {
        isMainThread: isMainThread,
        currentWorker: parentPort as unknown as Worker,
        getCurrentWorkerData: () => workerData,

        newWorker: (fileName, data?: any) => {
            declareUsingWorker();

            const res = data ?
                new NodeWorker(fileName, {workerData: data}) :
                new NodeWorker(fileName);

            return res as unknown as Worker
        },

        unrefThisWorker: (worker: Worker) => {
            (worker as unknown as NodeWorker).unref();
        },

        closeCurrentThread() {
            if (parentPort) {
                parentPort.close();
            }
        }
    }
}