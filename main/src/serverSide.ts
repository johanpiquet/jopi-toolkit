import {patch_process} from "./_process_s.ts";
import {patch_thread} from "./_thread_s.ts";
import {patch_fs} from "./_fs_s.ts";
import {patch_crypto} from "./_crypto_s.ts";
import {patch_compress} from "./_compress_s.ts";

import type {ServerType} from "./__global.ts";
import {isBunJs, isNodeJs} from "./common.ts";

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
patch_crypto();
patch_compress();

NodeSpace.app.declareServerSideReady();
process.on('exit', () => NodeSpace.app.declareAppExiting());