import {isMainThread, parentPort, Worker as NodeWorker, workerData} from "node:worker_threads";
import {declareUsingWorker} from "./internal.ts";
import fs from "node:fs/promises";

NodeSpace.process = {
    argv: process.argv,
    env: process.env as { [key: string]: string },
    isProduction: process.env.NODE_ENV === 'production'
};

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

NodeSpace.fs = {
    mkDir: (dirPath: string) => fs.mkdir(dirPath, {recursive: true})
}

NodeSpace.app.declareServerSideReady();

process.on('exit', () => NodeSpace.app.declareAppExiting());