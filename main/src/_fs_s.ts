import fs from "node:fs/promises";
import fss from "node:fs";
import {fileURLToPath} from "url";
import {isBunJs} from "./common.ts";
import {pathToFileURL} from "node:url";
import { lookup } from "mime-types";
import type {Readable} from "node:stream";
import {createReadStream} from "node:fs";
import type {FileState, FileSystemImpl} from "./__global.ts";
import {merge} from "./internal";
import path from "node:path";

//region NodeJS adapter

async function writeResponseToFile(response: Response, filePath: string) {
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
    try {
        return (await fs.stat(filePath)).size;
    }
    catch {
        return 0;
    }
}

function getFileStat(filePath: string): Promise<FileState|undefined> {
    try { return fs.stat(filePath); }
    catch { return Promise.resolve(undefined); }
}

//endregion

function getMimeTypeFromName(fileName: string) {
    const found = lookup(fileName);
    if (found===false) return "";
    return found;
}

async function mkDirRect(dirPath: string): Promise<void> {
    try {
        await fs.mkdir(dirPath, {recursive: true});
    }
    catch {}
}

async function writeTextToFile(filePath: string, text: string, createDir: boolean = true): Promise<void> {
    if (createDir) await mkDirRect(path.dirname(filePath));
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

export function patch_fs() {
    const myFS: FileSystemImpl = {
        mkDir: mkDirRect,
        fileURLToPath: (url) => fileURLToPath(url),
        pathToFileURL: (fsPath) => pathToFileURL(fsPath),

        getFileSize,
        getMimeTypeFromName,
        writeResponseToFile,
        createResponseFromFile,
        getFileStat,

        writeTextToFile, readTextFromFile, readTextSyncFromFile,
        isFile, isDirectory
    };

    merge(NodeSpace.fs, myFS);

    if (isBunJs()) {
        NodeSpace.fs.fileURLToPath = (url) => Bun.fileURLToPath(url);
        NodeSpace.fs.pathToFileURL = (fsPath) => Bun.pathToFileURL(fsPath);
        NodeSpace.fs.writeResponseToFile = async (r: Response, p: string) => { await Bun.file(p).write(r); }

        NodeSpace.fs.createResponseFromFile = (filePath, status, headers) => {
            return new Response(Bun.file(filePath), {status, headers});
        };
    }
}