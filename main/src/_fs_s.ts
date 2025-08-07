import fs from "node:fs/promises";
import fss from "node:fs";
import {fileURLToPath} from "url";
import {isBunJs} from "./common.ts";
import {pathToFileURL} from "node:url";
import { lookup } from "mime-types";
import type {Readable} from "node:stream";
import {createReadStream} from "node:fs";
import type {FileState, FileSystemImpl} from "./__global.ts";
import {merge} from "./internal.ts";
import path from "node:path";

//region Node.js adapter

async function writeResponseToFile(response: Response, filePath: string, createDir: boolean = true) {
    if (createDir) await mkDirRec(path.dirname(filePath));
    const bufferDonnees = await response.arrayBuffer();
    const bufferNode = Buffer.from(bufferDonnees);
    await fs.writeFile(filePath, bufferNode);
}

function nodeStreamToWebStream(nodeStream: Readable): ReadableStream {
        return new ReadableStream({
            start(controller) {
                nodeStream.on('data', (chunk: Buffer) => { controller.enqueue(chunk) });
                nodeStream.on('end', () => { controller.close() });
                nodeStream.on('error', (err) => { controller.error(err) });
            }
        });
}

function createResponseFromFile(filePath: string, status: number = 200, headers?: {[key: string]: string}|Headers): Response {
    const nodeReadStream = createReadStream(filePath);
    const webReadableStream = nodeStreamToWebStream(nodeReadStream);
    return new Response(webReadableStream, {status: status, headers: headers});
}

async function getFileSize(filePath: string): Promise<number> {
    try { return (await fs.stat(filePath)).size; }
    catch { return 0; }
}

async function getFileStat(filePath: string): Promise<FileState|undefined> {
    try { return await fs.stat(filePath); }
    catch { return undefined; }
}

//endregion

function getMimeTypeFromName(fileName: string) {
    const found = lookup(fileName);
    if (found===false) return "";
    return found;
}

async function mkDirRec(dirPath: string): Promise<void> {
    try {
        await fs.mkdir(dirPath, {recursive: true});
    }
    catch {}
}

async function writeTextToFile(filePath: string, text: string, createDir: boolean = true): Promise<void> {
    if (createDir) await mkDirRec(path.dirname(filePath));
    await fs.writeFile(filePath, text, {encoding: 'utf8', flag: 'w'});
}

function readTextFromFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf8');
}

function readTextSyncFromFile(filePath: string): string {
    return fss.readFileSync(filePath, 'utf8');
}

async function isFile(filePath: string): Promise<boolean> {
    const stats = await getFileStat(filePath);
    if (!stats) return false;
    return stats.isFile();
}

async function isDirectory(filePath: string): Promise<boolean> {
    const stats = await getFileStat(filePath);
    if (!stats) return false;
    return stats.isDirectory();
}

async function readFileToBytes(filePath: string): Promise<Uint8Array> {
    const buffer = await fs.readFile(filePath);
    return new Uint8Array(buffer);
}

export function patch_fs() {
    const myFS: FileSystemImpl = {
        mkDir: mkDirRec,
        fileURLToPath: (url) => fileURLToPath(url),
        pathToFileURL: (fsPath) => pathToFileURL(fsPath),
        unlink: (filePath) => fs.unlink(filePath),

        getFileSize,
        getMimeTypeFromName,
        writeResponseToFile,
        createResponseFromFile,
        getFileStat,
        readFileToBytes,

        writeTextToFile, readTextFromFile, readTextSyncFromFile,
        isFile, isDirectory
    };

    if (isBunJs()) {
        myFS.fileURLToPath = (url) => Bun.fileURLToPath(url);
        myFS.pathToFileURL = (fsPath) => Bun.pathToFileURL(fsPath);
        myFS.writeResponseToFile = async (r: Response, p: string) => { await Bun.file(p).write(r); }
        myFS.createResponseFromFile = (filePath, status, headers) => new Response(Bun.file(filePath), {status, headers});
        myFS.readFileToBytes = async (filePath) => Bun.file(filePath).bytes();
    }
    
    merge(NodeSpace.fs, myFS);
}