import type {CompressImpl} from "./__global.ts";
import {isBunJs} from "./common.ts";
import {merge} from "./internal.ts";
import {gunzipSync, gzipSync} from "node:zlib";


export function patch_compress() {
    const myCompress: CompressImpl = {
        gunzipSync: data => gunzipSync(Buffer.from(data)),
        gzipSync: data => gzipSync(Buffer.from(data))
    };

    if (isBunJs()) {
        myCompress.gunzipSync = Bun.gunzipSync;
        myCompress.gzipSync = Bun.gzipSync;
    }

    merge(NodeSpace.compress, myCompress);
}