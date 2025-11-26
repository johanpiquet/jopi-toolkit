import crypto from "node:crypto";
import {isNodeJS} from "jopi-toolkit/jk_what";

function node_md5(data: string | Uint8Array): string {
    return crypto.createHash('md5').update(data).digest('hex');
}

function node_fastHash(data: string | Uint8Array): string {
    return crypto.createHash('sha256').update(data).digest('hex');
}

function bun_fastHash(data: string | Uint8Array): string {
    return Bun.hash(data, 12346).toString();
}

function bun_md5(data: string | Uint8Array): string {
    return Bun.MD5.hash(data, "hex");
}

export const md5 = isNodeJS ? node_md5 : bun_md5;
export const fastHash = isNodeJS ? node_fastHash : bun_fastHash;