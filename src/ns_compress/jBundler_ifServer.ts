import {gunzipSync as n_gunzipSync, gzipSync as n_gzipSync} from "node:zlib";
import {isNodeJS} from "jopi-node-space/ns_what";

type t_gunzipSync = (data: Uint8Array|string) => Buffer;
type t_gzipSync = (data: Uint8Array|string) => Buffer;

function node_gunzipSync(data: Uint8Array|string): Buffer {
    return n_gunzipSync(Buffer.from(data));
}

function node_gzipSync(data: Uint8Array|string): Buffer {
    return n_gzipSync(Buffer.from(data));
}

export const gunzipSync: t_gunzipSync = isNodeJS ? node_gunzipSync : (Bun.gunzipSync as t_gunzipSync);
export const gzipSync: t_gzipSync = isNodeJS ? node_gzipSync : (Bun.gzipSync as t_gzipSync);
