import {init_nodeSpaceWhat} from "./_what.ts";
import {init_nodeSpaceApp} from "./_app.ts";
import {init_nodeSpaceProcess} from "./_process.ts";
import {init_nodeSpaceTimer} from "./_timer.ts";
import {init_nodeSpaceThread} from "./_thread.ts";
import {init_nodeSpaceExtensionPoints} from "./_extensionPoints.ts";
import {init_term} from "./_term.ts";
import type {CompressImpl, CryptoImpl, FileSystemImpl, OsImpl, StreamImpl} from "./__global.ts";
import {init_webSocket} from "./_webSocket.ts";

function applyDefaults<T>(source: T|undefined, defaults: T): T {
    if (!source) source = {} as T;
    return {...defaults, ...source};
}

function getErrorMessage(e: unknown): string {
    if (e instanceof Error) return e.message;
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
    NodeSpace.fs = {} as FileSystemImpl;
    NodeSpace.crypto = {} as CryptoImpl;
    NodeSpace.compress = {} as CompressImpl;
    NodeSpace.os = {} as OsImpl;
    NodeSpace.stream = {} as StreamImpl;
}

initBrowser();