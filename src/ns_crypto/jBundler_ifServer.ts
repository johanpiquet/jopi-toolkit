import crypto from "node:crypto";
import {isNodeJS} from "jopi-toolkit/ns_what";

function node_md5(text: string): string {
    return crypto.createHash('md5').update(text).digest('hex');
}

function node_fastHash(text: string): string {
    return crypto.createHash('sha256').update(text).digest('hex');
}

function bun_fastHash(text: string): string {
    return Bun.hash(text).toString();
}

function bun_md5(text: string): string {
    return Bun.MD5.hash(text, "hex");
}

export const md5 = isNodeJS ? node_md5 : bun_md5;
export const fastHash = isNodeJS ? node_fastHash : bun_fastHash;