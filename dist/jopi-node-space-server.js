import { patch_process } from "./_process_s.js";
import { patch_thread } from "./_thread_s.js";
import { patch_fs } from "./_fs_s.js";
import { patch_crypto } from "./_crypto_s.js";
import { patch_compress } from "./_compress_s.js";
import { isBunJs, isNodeJs } from "./common.js";
import { patch_os } from "./_os_s.js";
import { patch_stream } from "./_stream_s.js";
import { patch_webSocket } from "./_webSocket_s.js";
let serverType = "nodejs";
if (isBunJs())
    serverType = "bunjs";
const nodeSpace = globalThis.NodeSpace;
nodeSpace.what = {
    isNodeJS: isNodeJs(),
    isBunJs: isBunJs(),
    isBrowser: false,
    isServerSide: true,
    serverType: serverType,
};
patch_process();
patch_thread();
patch_fs();
patch_stream();
patch_crypto();
patch_compress();
patch_os();
patch_webSocket();
NodeSpace.app.declareServerSideReady();
process.on('exit', () => NodeSpace.app.declareAppExiting());
//# sourceMappingURL=jopi-node-space-server.js.map