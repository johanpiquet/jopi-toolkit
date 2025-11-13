import { gunzipSync as n_gunzipSync, gzipSync as n_gzipSync } from "node:zlib";
import { isNodeJS } from "jopi-toolkit/jk_what";
function node_gunzipSync(data) {
    return n_gunzipSync(Buffer.from(data));
}
function node_gzipSync(data) {
    return n_gzipSync(Buffer.from(data));
}
export var gunzipSync = isNodeJS ? node_gunzipSync : Bun.gunzipSync;
export var gzipSync = isNodeJS ? node_gzipSync : Bun.gzipSync;
