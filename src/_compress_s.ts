import type {CompressImpl} from "./__global.ts";
import {merge} from "./internal.ts";
import {gunzipSync, gzipSync} from "node:zlib";
import {getInstance} from "./instance.ts";
import {isBunJS} from "jopi-node-space/ns_what";

const NodeSpace = getInstance();

export function patch_compress() {
    const myCompress: CompressImpl = {
        gunzipSync: data => gunzipSync(Buffer.from(data)),
        gzipSync: data => gzipSync(Buffer.from(data))
    };

    if (isBunJS) {
        //@ts-ignore Accepting function signature
        myCompress.gunzipSync = Bun.gunzipSync;
        //@ts-ignore Accepting function signature
        myCompress.gzipSync = Bun.gzipSync;
    }

    merge(NodeSpace.compress, myCompress);
}