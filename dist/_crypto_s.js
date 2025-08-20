import { merge } from "./internal.js";
import crypto from "node:crypto";
import { isBunJs } from "./common.js";
export function patch_crypto() {
    const myCrypto = {
        md5(text) {
            return crypto.createHash('md5').update(text).digest('hex');
        },
        fastHash(text) {
            return crypto.createHash('sha256').update(text).digest('hex');
        }
    };
    if (isBunJs()) {
        myCrypto.fastHash = t => Bun.hash(t).toString();
        myCrypto.md5 = t => Bun.MD5.hash(t, "hex");
    }
    merge(NodeSpace.crypto, myCrypto);
}
//# sourceMappingURL=_crypto_s.js.map