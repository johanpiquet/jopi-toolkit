export * from "./__global.ts";
import "./jopi-node-space-browser.ts";
import {getInstance} from "./instance.ts";

const NodeSpace = getInstance();

// Will be removed by the vite-js plugin.
// See test-browser/vite.config.ts
//
import "./jopi-node-space-server.ts";

NodeSpace.nodeSpaceVersion = "0.0.1";
NodeSpace.nodeLibPath = import.meta.url;

export const nEvents = NodeSpace.events;
export const nFs = NodeSpace.fs;
export const nCrypto = NodeSpace.crypto;
export const nCompress = NodeSpace.compress;
export const nOs = NodeSpace.os;
export const nStream = NodeSpace.stream;
export const nTranslate = NodeSpace.translate;
export const nThread = NodeSpace.thread;
export const nWebSocket = NodeSpace.webSocket;
export const nWhat = NodeSpace.what;

export default getInstance();