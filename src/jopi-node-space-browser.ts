import {init_nodeSpaceWhat} from "./_what.ts";
import {init_nodeSpaceApp} from "./_app.ts";
import {init_nodeSpaceTimer} from "./_timer.ts";
import {init_term} from "./_term.ts";
import type {CompressImpl, FileSystemImpl, StreamImpl} from "./__global.ts";
import {init_webSocket} from "./_webSocket.ts";
import {getInstance} from "./instance.ts";
import {init_nodeSpaceEvents} from "./_events.ts";

const NodeSpace = getInstance();

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
    init_nodeSpaceEvents();
    init_nodeSpaceApp();
    init_nodeSpaceTimer();
    init_term();
    init_webSocket();

    // Allow the ref to exist.
    //
    NodeSpace.fs = {} as FileSystemImpl;
    NodeSpace.compress = {} as CompressImpl;
    NodeSpace.stream = {} as StreamImpl;
}

initBrowser();