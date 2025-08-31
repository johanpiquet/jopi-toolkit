import {patch_process} from "./_process_s.ts";
import {patch_thread} from "./_thread_s.ts";
import {patch_fs} from "./_fs_s.ts";
import {patch_crypto} from "./_crypto_s.ts";
import {patch_compress} from "./_compress_s.ts";

import type {ServerType} from "./__global.ts";
import {isBunJs, isNodeJs} from "./common.ts";
import {patch_os} from "./_os_s.ts";
import {patch_stream} from "./_stream_s.ts";
import {patch_webSocket} from "./_webSocket_s.ts";

let serverType: ServerType = "nodejs";
if (isBunJs()) serverType = "bunjs";
const nodeSpace = globalThis.NodeSpace;

nodeSpace.what = {
    isNodeJS: isNodeJs(),
    isBunJs: isBunJs(),
    isBrowser: false,
    isServerSide: true,
    serverType: serverType,
}

patch_process();
patch_thread();
patch_fs();
patch_stream();
patch_crypto();
patch_compress();
patch_os();
patch_webSocket();

NodeSpace.app.declareServerSideReady();

// When the program exits gracefully
process.on('exit', () => NodeSpace.app.declareAppExiting());
// When the user wants to terminate the program (CTRL+C)
process.on('SIGINT', () => NodeSpace.app.declareAppExiting());
// Signal for debugger
process.on('SIGUSR1', () => NodeSpace.app.declareAppExiting());
// Signal for debugger
process.on('SIGUSR2', () => NodeSpace.app.declareAppExiting());