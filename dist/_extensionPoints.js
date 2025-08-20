import {} from "./__global.js";
const gExtensionPoints = {};
function createExtensionPoint(epName, hostInfo, callerInfo, listenerInfo) {
    async function caller(...args) {
        for (const listener of ep.listeners) {
            const res = listener(...args);
            if (res instanceof Promise)
                await res;
        }
    }
    const listeners = [];
    const ep = {
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
        newHost(epName, importMetaUrl) {
            const ep = gExtensionPoints[epName];
            if (!ep)
                createExtensionPoint(epName, importMetaUrl, null, null);
            return ep.caller;
        },
        getCaller(epName, importMetaUrl) {
            const ep = gExtensionPoints[epName];
            if (!ep)
                createExtensionPoint(epName, null, importMetaUrl, null);
            return ep.caller;
        },
        on(epName, importMetaUrl, listener) {
            const ep = gExtensionPoints[epName];
            if (!ep)
                createExtensionPoint(epName, null, null, importMetaUrl);
            ep.listeners.push(listener);
        }
    };
}
//# sourceMappingURL=_extensionPoints.js.map