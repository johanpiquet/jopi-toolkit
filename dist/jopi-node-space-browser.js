import { init_nodeSpaceWhat } from "./_what.js";
import { init_nodeSpaceApp } from "./_app.js";
import { init_nodeSpaceProcess } from "./_process.js";
import { init_nodeSpaceTimer } from "./_timer.js";
import { init_nodeSpaceThread } from "./_thread.js";
import { init_nodeSpaceExtensionPoints } from "./_extensionPoints.js";
import { init_term } from "./_term.js";
import { init_webSocket } from "./_webSocket.js";
function applyDefaults(source, defaults) {
    if (!source)
        source = {};
    return { ...defaults, ...source };
}
function getErrorMessage(e) {
    if (e instanceof Error)
        return e.message;
    return "" + e;
}
function initBrowser() {
    NodeSpace.applyDefaults = applyDefaults;
    NodeSpace.getErrorMessage = getErrorMessage;
    init_nodeSpaceWhat();
    init_nodeSpaceApp();
    init_nodeSpaceProcess();
    init_nodeSpaceTimer();
    init_nodeSpaceThread();
    init_nodeSpaceExtensionPoints();
    init_term();
    init_webSocket();
    // Allow the ref to exist.
    //
    NodeSpace.fs = {};
    NodeSpace.crypto = {};
    NodeSpace.compress = {};
    NodeSpace.os = {};
    NodeSpace.stream = {};
}
initBrowser();
//# sourceMappingURL=jopi-node-space-browser.js.map