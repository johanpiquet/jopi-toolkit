import {execListeners, isBunJs, isNodeJs} from "./common.ts";
import {isUsingWorker} from "./internal.ts";
import type {Listener} from "./__global.ts";

export function init_nodeSpaceApp() {
    const onServerSideReady: Listener[] = [];
    const onAppExiting: Listener[] = [];
    const onAppExited: Listener[] = [];
    const onAppStart: Listener[] = [];
    let isServerSideReady = !(isNodeJs() || isBunJs());

    let isHotReload = globalThis.jopiHotReload !== undefined;
    let gIsAppStarted = false;

    if (isHotReload) {
        execListeners(globalThis.jopiHotReload.onHotReload).then();
    } else {
        globalThis.jopiHotReload = {
            onHotReload: [],
            memory: {}
        }
    }

    const onHotReload = globalThis.jopiHotReload.onHotReload;
    const memory = globalThis.jopiHotReload.memory;

    NodeSpace.app = {
        onServerSideReady: (listener) => {
            if (isServerSideReady) listener();
            else onServerSideReady.push(listener);
        },

        waitServerSideReady: () => {
            if (isServerSideReady) {
                return Promise.resolve();
            }

            return new Promise<void>(r => {
                NodeSpace.app.onServerSideReady(r);
            })
        },

        declareServerSideReady: async () => {
            isServerSideReady = true;
            await execListeners(onServerSideReady);
        },

        onAppStart: (listener: Listener) => {
            if (gIsAppStarted) listener();
            else onAppStart.push(listener);
        },

        onAppExiting: (listener: Listener) => {
            if (gIsExited) listener();
            else onAppExiting.push(listener);
        },

        onAppExited: (listener: Listener) => {
            if (gIsExited) listener();
            else onAppExited.push(listener);
        },

        declareAppStarted: async () => {
            gIsAppStarted = true;
            await execListeners(onAppStart);
        },

        declareAppExiting: async () => {
            if (gIsExited) return;
            gIsExited = true;

            if (isUsingWorker()) {
                // Wait 1 sec, which allows the worker to correctly initialize.
                await NodeSpace.timer.tick(1000);
            }

            gIsAppStarted = false;

            await execListeners(onAppExiting);

            if (isUsingWorker()) {
                // Allows to worker to correctly stop their activity.
                await NodeSpace.timer.tick(100);
            }

            if (!NodeSpace.thread.isMainThread) {
                // Allows to worker to correctly stop their activity.
                await NodeSpace.timer.tick(50);
            }

            await execListeners(onAppExited);
        },

        executeApp: async (app) => {
            await NodeSpace.app.waitServerSideReady();
            NodeSpace.app.declareAppStarted();

            try {
                const res = app();
                if (res instanceof Promise) await res;
            }
            finally {
                NodeSpace.app.declareAppExiting();
            }
        },

        onHotReload(listener: Listener) {
            onHotReload.push(listener);
        },

        keepOnHotReload: (key, provider) => {
            let current = memory[key];
            if (current!==undefined) return current;
            return memory[key] = provider();
        },

        clearHotReloadKey: (key) => {
            delete(memory[key]);
        }
    };
}

let gIsExited = false;