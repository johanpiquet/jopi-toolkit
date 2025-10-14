export * from "./__global.ts";
import "./jopi-node-space-browser.ts";
import {getInstance} from "./instance.ts";

const NodeSpace = getInstance();

// Will be removed by a bundler plugin (ex: ViteJS).
// See test-browser/vite.config.ts
//
import "./jopi-node-space-server.ts";

NodeSpace.nodeSpaceVersion = "0.0.1";
NodeSpace.nodeLibPath = import.meta.url;

export const nApp = NodeSpace.app;
export const nTerm = NodeSpace.term;
export const nWebSocket = NodeSpace.webSocket;

export const nCompress = NodeSpace.compress;
export const nStream = NodeSpace.stream;

export default getInstance();