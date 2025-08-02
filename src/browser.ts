import {init_nodeSpaceWhat} from "./_what";
import {init_nodeSpaceApp} from "./_app";
import {init_nodeSpaceProcess} from "./_process";
import {init_nodeSpaceTimer} from "./_timer";
import {init_nodeSpaceThread} from "./_thread";
import {init_nodeSpaceExtensionPoints} from "./_extensionPoints";
import {init_term} from "./_term";

function applyDefaults<T>(source: T|undefined, defaults: T): T {
    if (!source) source = {} as T;
    return {...defaults, ...source};
}

export function initBrowser() {
    NodeSpace.applyDefaults = applyDefaults;

    init_nodeSpaceWhat();
    init_nodeSpaceApp();
    init_nodeSpaceProcess();
    init_nodeSpaceTimer();
    init_nodeSpaceThread();
    init_nodeSpaceExtensionPoints();
    init_term();
}