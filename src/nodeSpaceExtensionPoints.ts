import {type EpCaller, type EpListener} from "./common.ts";

interface ExtensionPoint {
    listeners: EpListener[];
    caller: EpCaller;

    allHostPath: string[];
    allCallerPath: string[];
    allListenerPath: string[];
}

const gExtensionPoints: {[epName: string]: ExtensionPoint} = {
}

function createExtensionPoint(epName: string, hostInfo: string|null, callerInfo: string|null, listenerInfo: string|null) {
    async function caller(...args: unknown[]) {
        for (const listener of ep.listeners) {
            const res = listener(...args);
            if (res instanceof Promise) await res;
        }
    }

    const listeners: EpListener[] = [];

    const ep: ExtensionPoint = {
        listeners, caller,
        allHostPath: [],
        allCallerPath: [],
        allListenerPath: []
    };

    gExtensionPoints[epName] = ep;

    if (hostInfo) {
        ep.allHostPath.push(hostInfo);
    }

    if (callerInfo) {
        ep.allCallerPath.push(callerInfo);
    }

    if (listenerInfo) {
        ep.allListenerPath.push(listenerInfo);
    }
}

export function init_nodeSpaceExtensionPoints() {
    NodeSpace.extensionPoints = {
        newHost(epName: string, importMetaUrl: string): EpCaller {
            const ep = gExtensionPoints[epName];
            if (!ep) createExtensionPoint(epName, importMetaUrl, null, null);
            return ep.caller;
        },

        getCaller(epName: string, importMetaUrl: string): EpCaller {
            const ep = gExtensionPoints[epName];
            if (!ep) createExtensionPoint(epName, null, importMetaUrl, null);
            return ep.caller;
        },

        on(epName: string, importMetaUrl: string, listener: EpListener): void {
            const ep = gExtensionPoints[epName];
            if (!ep) createExtensionPoint(epName, null, null, importMetaUrl);
            ep.listeners.push(listener);
        }
    };
}