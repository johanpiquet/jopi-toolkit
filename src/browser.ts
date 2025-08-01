import {init_nodeSpaceWhat} from "./nodeSpaceWhat.ts";
import {init_nodeSpaceApp} from "./nodeSpaceApp.ts";
import {init_nodeSpaceProcess} from "./nodeSpaceProcess.ts";
import {init_nodeSpaceTimer} from "./nodeSpaceTimer.ts";
import {init_nodeSpaceThread} from "./nodeSpaceThread.ts";
import {init_nodeSpaceExtensionPoints} from "./nodeSpaceExtensionPoints";

export function initBrowser() {
    init_nodeSpaceWhat();
    init_nodeSpaceApp();
    init_nodeSpaceProcess();
    init_nodeSpaceTimer();
    init_nodeSpaceThread();
    init_nodeSpaceExtensionPoints();
}