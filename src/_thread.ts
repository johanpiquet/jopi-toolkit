import {declareUsingWorker} from "./internal.ts";
import {getInstance} from "./instance.ts";

const NodeSpace = getInstance();

export function init_nodeSpaceThread() {
    NodeSpace.thread = {
        isMainThread: true,
        currentWorker: null,
        getCurrentWorkerData: () => {},
        unrefThisWorker: () => {},

        newWorker: (fileName) => {
            declareUsingWorker();
            return new Worker(fileName, {type: 'module'})
        },

        closeCurrentThread() {
            if (self.close) {
                self.close();
            }
        }
    };
}