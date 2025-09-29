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

export default getInstance();