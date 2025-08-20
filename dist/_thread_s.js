import { isMainThread, parentPort, workerData } from "node:worker_threads";
import { declareUsingWorker, merge } from "./internal.js";
import { Worker as NodeWorker } from "node:worker_threads";
export function patch_thread() {
    const myThread = {
        isMainThread: isMainThread,
        currentWorker: parentPort,
        getCurrentWorkerData: () => workerData,
        newWorker: (fileName, data) => {
            declareUsingWorker();
            const res = data ?
                new NodeWorker(fileName, { workerData: data }) :
                new NodeWorker(fileName);
            return res;
        },
        unrefThisWorker: (worker) => {
            worker.unref();
        },
        closeCurrentThread() {
            if (parentPort) {
                parentPort.close();
            }
        }
    };
    merge(NodeSpace.thread, myThread);
}
//# sourceMappingURL=_thread_s.js.map