import {init_nodeSpaceApp} from "./_app.ts";
import type {CompressImpl, StreamImpl} from "./__global.ts";
import {init_webSocket} from "./_webSocket.ts";
import {getInstance} from "./instance.ts";

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

    init_nodeSpaceApp();
    init_webSocket();

    // Allow the ref to exist.
    //
    NodeSpace.compress = {} as CompressImpl;
    NodeSpace.stream = {} as StreamImpl;
}

initBrowser();