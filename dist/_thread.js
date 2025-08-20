import { declareUsingWorker } from "./internal.js";
export function init_nodeSpaceThread() {
    NodeSpace.thread = {
        isMainThread: true,
        currentWorker: null,
        getCurrentWorkerData: () => { },
        unrefThisWorker: () => { },
        newWorker: (fileName) => {
            declareUsingWorker();
            return new Worker(fileName, { type: 'module' });
        },
        closeCurrentThread() {
            if (self.close) {
                self.close();
            }
        }
    };
}
//# sourceMappingURL=_thread.js.map