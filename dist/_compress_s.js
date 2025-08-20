import { isBunJs } from "./common.js";
import { merge } from "./internal.js";
import { gunzipSync, gzipSync } from "node:zlib";
export function patch_compress() {
    const myCompress = {
        gunzipSync: data => gunzipSync(Buffer.from(data)),
        gzipSync: data => gzipSync(Buffer.from(data))
    };
    if (isBunJs()) {
        //@ts-ignore Accepting function signature
        myCompress.gunzipSync = Bun.gunzipSync;
        //@ts-ignore Accepting function signature
        myCompress.gzipSync = Bun.gzipSync;
    }
    merge(NodeSpace.compress, myCompress);
}
//# sourceMappingURL=_compress_s.js.map