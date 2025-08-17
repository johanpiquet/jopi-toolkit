import {merge} from "./internal.ts";
import crypto from "node:crypto";
import type {CryptoImpl} from "./__global.ts";
import {isBunJs} from "./common.ts";

export function patch_crypto() {
    const myCrypto: CryptoImpl = {
        md5(text: string): string {
            return crypto.createHash('md5').update(text).digest('hex');
        },

        fastHash(text: string): string {
            return crypto.createHash('sha256').update(text).digest('hex');
        }
    };

    if (isBunJs()) {
        myCrypto.fastHash = t => Bun.hash(t).toString();
        myCrypto.md5 = t => Bun.MD5.hash(t, "hex");
    }

    merge(NodeSpace.crypto, myCrypto);
}