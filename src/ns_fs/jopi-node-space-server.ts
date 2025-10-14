// noinspection JSUnusedGlobalSymbols

import fs from "node:fs/promises";
import fss, {createReadStream} from "node:fs";
import {fileURLToPath as n_fileURLToPath, pathToFileURL as n_pathToFileURL } from "node:url";
import {lookup} from "mime-types";
import {Readable} from "node:stream";
import path from "node:path";
import {isBunJS} from "jopi-node-space/ns_what";
import type {DirItem, FileState} from "./common.ts";

class WebToNodeReadableStreamAdapter extends Readable {
    private webStreamReader: ReadableStreamDefaultReader<any>;

    constructor(webStream: ReadableStream<any>) {
        super();
        this.webStreamReader = webStream.getReader();
    }

    _read() {
        this.webStreamReader.read().then(({ done, value }) => {
            if (done) {this.push(null); return; }
            const buffer = Buffer.from(value);
            if (!this.push(buffer)) this.webStreamReader.cancel().then();
        }).catch(err => {
            this.destroy(err);
        });
    }

    _destroy(err: Error | null, callback: (error?: Error | null) => void): void {
        this.webStreamReader.cancel().finally(() => { callback(err) });
    }
}

async function writeResponseToFile_node(response: Response, filePath: string, createDir: boolean = true) {
    if (createDir) await mkDir(path.dirname(filePath));
    const bufferDonnees = await response.arrayBuffer();
    const bufferNode = Buffer.from(bufferDonnees);
    await fs.writeFile(filePath, bufferNode);
}

export const writeResponseToFile = isBunJS
    ? async (r: Response, p: string) => { await Bun.file(p).write(r); }
    : writeResponseToFile_node;

export function nodeStreamToWebStream(nodeStream: Readable, debugInfos?: string): ReadableStream {
    let dataListener: (chunk: Buffer) => void;
    let endListener: () => void;
    let errorListener: (err: Error) => void;

    return new ReadableStream({
        start(controller) {
            dataListener = (chunk: Buffer) => {
                try {
                    controller.enqueue(chunk);
                } catch (e) {
                    if (debugInfos) {
                        console.log("nodeStreamToWebStream - enqueue failed for " + debugInfos, e);
                    }

                    nodeStream.destroy(new Error("WebStream controller closed unexpectedly"));
                    nodeStream.off('data', dataListener);
                    nodeStream.off('end', endListener);
                    nodeStream.off('error', errorListener);
                }
            };

            endListener = () => {
                try {
                    controller.close();
                } catch (e) {
                    if (debugInfos) {
                        console.log("nodeStreamToWebStream - close failed for " + debugInfos, e);
                    }
                }
            };

            errorListener = (err: Error) => {
                controller.error(err);
                nodeStream.off('data', dataListener);
                nodeStream.off('end', endListener);
            };

            nodeStream.on('data', dataListener);
            nodeStream.on('end', endListener);
            nodeStream.on('error', errorListener);
        },

        cancel(reason) {
            if (debugInfos) {
                console.log(`nodeStreamToWebStream - stream cancelled for ${debugInfos}. Reason: ${reason || 'Client disconnected'}`,);
            }

            if (dataListener) nodeStream.off('data', dataListener);
            if (endListener) nodeStream.off('end', endListener);
            if (errorListener) nodeStream.off('error', errorListener);

            if (typeof nodeStream.destroy === 'function') {
                nodeStream.destroy();
            }
        }
    });
}

export function webStreamToNodeStream(webStream: ReadableStream): Readable {
    return new WebToNodeReadableStreamAdapter(webStream);
}

function createResponseFromFile_node(filePath: string, status: number = 200, headers?: {[key: string]: string}|Headers): Response {
    const nodeReadStream = createReadStream(filePath);
    const webReadableStream = nodeStreamToWebStream(nodeReadStream, filePath);
    return new Response(webReadableStream, {status: status, headers: headers});
}

export const createResponseFromFile = isBunJS
    ? (filePath: string, status: number = 200, headers?: {[key: string]: string}|Headers) => new Response(Bun.file(filePath), {status, headers})
    : createResponseFromFile_node;

export async function getFileSize(filePath: string): Promise<number> {
    try { return (await fs.stat(filePath)).size; }
    catch { return 0; }
}

export async function getFileStat(filePath: string): Promise<FileState|undefined> {
    try { return await fs.stat(filePath); }
    catch { return undefined; }
}

export function getMimeTypeFromName(fileName: string) {
    const found = lookup(fileName);
    if (found===false) return "";
    return found;
}

export async function mkDir(dirPath: string): Promise<boolean> {
    try {
        await fs.mkdir(dirPath, {recursive: true});
        return true;
    }
    catch {
        return false;
    }
}

export async function rmDir(dirPath: string): Promise<boolean> {
    try {
        await fs.rm(dirPath, {recursive: true, force: true});
        return true;
    }
    catch {
        return false;
    }
}

export const fileURLToPath = isBunJS
    ? (url: string) => Bun.fileURLToPath(url)
    : n_fileURLToPath;

export const pathToFileURL = isBunJS
    ? (fsPath: string) => Bun.pathToFileURL(fsPath)
    : n_pathToFileURL;

export async function unlink(filePath: string): Promise<boolean> {
    try { await fs.unlink(filePath); return true; }
    catch { return false; }
}

export async function writeTextToFile(filePath: string, text: string, createDir: boolean = true): Promise<void> {
    if (createDir) await mkDir(path.dirname(filePath));
    await fs.writeFile(filePath, text, {encoding: 'utf8', flag: 'w'});
}

export function writeTextSyncToFile(filePath: string, text: string, createDir: boolean = true): void {
    if (createDir) {
        try {
            fss.mkdirSync(path.dirname(filePath), {recursive: true});
        } catch {}
    }
    fss.writeFileSync(filePath, text, {encoding: 'utf8', flag: 'w'});
}

export function readTextFromFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf8');
}

export function readTextSyncFromFile(filePath: string): string {
    return fss.readFileSync(filePath, 'utf8');
}

export async function isFile(filePath: string): Promise<boolean> {
    const stats = await getFileStat(filePath);
    if (!stats) return false;
    return stats.isFile();
}

export async function isDirectory(filePath: string): Promise<boolean> {
    const stats = await getFileStat(filePath);
    if (!stats) return false;
    return stats.isDirectory();
}

export function isDirectorySync(dirPath: string) {
    try {
        const stats = fss.statSync(dirPath);
        return stats.isDirectory();
    }
    catch {
    }

    return false;
}

export function isFileSync(dirPath: string) {
    try {
        const stats = fss.statSync(dirPath);
        return stats.isFile();
    }
    catch {
    }

    return false;
}

async function readFileToBytes_node(filePath: string): Promise<Uint8Array> {
    const buffer = await fs.readFile(filePath);
    return new Uint8Array(buffer);
}

export const readFileToBytes = isBunJS
    ? async (filePath: string) => Bun.file(filePath).bytes()
    : readFileToBytes_node

export function getRelativePath(absolutePath: string, fromPath: string = process.cwd()) {
    return path.relative(fromPath, absolutePath);
}

export async function listDir(dirPath: string): Promise<DirItem[]> {
    const ditItems = await fs.readdir(dirPath);
    const result: DirItem[] = [];

    for (const dirItem of ditItems) {
        let toAdd: DirItem = {name: dirItem, fullPath: path.join(dirPath, dirItem)};
        const stats = await fs.stat(toAdd.fullPath);

        if (stats.isFile()) {
            toAdd.isFile = true;
        } else if (stats.isDirectory()) {
            toAdd.isDirectory = true;
        } else if (stats.isSymbolicLink()) {
            toAdd.isSymbolicLink = true;
        } else {
            continue;
        }

        result.push(toAdd);
    }

    return result;
}

/**
 * Convert a simple win32 path to a linux path.
 */
export function win32ToLinuxPath(filePath: string): string {
    return filePath.replace(/\\/g, '/');
}

export const join = path.join;
export const resolve = path.resolve;
export const dirname = path.dirname;
export const extname = path.extname;

export const sep = path.sep;
export const isAbsolute = path.isAbsolute;
export const normalize = path.normalize;
export const basename = path.basename;