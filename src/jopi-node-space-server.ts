import {patch_compress} from "./_compress_s.ts";

import type {ServerType} from "./__global.ts";
import {isBunJs, isNodeJs} from "./common.ts";
import {patch_stream} from "./_stream_s.ts";
import {patch_webSocket} from "./_webSocket_s.ts";

let serverType: ServerType = "nodejs";
if (isBunJs()) serverType = "bunjs";

import {getInstance} from "./instance.ts";

const NodeSpace = getInstance();

NodeSpace.what = {
    isNodeJS: isNodeJs(),
    isBunJs: isBunJs(),
    isBrowser: false,
    isServerSide: true,
    serverType: serverType,
}

patch_stream();
patch_compress();
patch_webSocket();

NodeSpace.app.declareServerSideReady();

// When the program exits gracefully
process.on('exit', () => NodeSpace.app.declareAppExiting());

// When the user wants to terminate the program (CTRL+C)
process.on('SIGINT', () => NodeSpace.app.declareAppExiting());
