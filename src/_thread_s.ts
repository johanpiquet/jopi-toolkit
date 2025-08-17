import {isMainThread, parentPort, workerData} from "node:worker_threads";
import {declareUsingWorker, merge} from "./internal.ts";
import {Worker as NodeWorker} from "node:worker_threads";
import type {ThreadImpl} from "./__global.ts";

export function patch_thread() {
    const myThread: ThreadImpl = {
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

    merge(NodeSpace.thread, myThread);
}