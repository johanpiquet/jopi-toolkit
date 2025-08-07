import fs from "node:fs/promises";
import {fileURLToPath} from "url";
import {isBunJs} from "./common.ts";
import {pathToFileURL} from "node:url";
import { lookup } from "mime-types";
import type {Readable} from "node:stream";
import {createReadStream} from "node:fs";
import type {FileState, FileSystemImpl} from "./__global.ts";
import {merge} from "./internal";

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
    const stat = await fs.stat(filePath);
    return stat.size;
}

function getFileStat(filePath: string): Promise<FileState> {
    return fs.stat(filePath);
}

//endregion

function getMimeTypeFromName(fileName: string) {
    const found = lookup(fileName);
    if (found===false) return "";
    return found;
}

async function writeTextToFile(filePath: string, text: string, createDir: boolean = true): Promise<void> {
    if (createDir) await fs.mkdir(filePath, {recursive: true});
    await fs.writeFile(filePath, text, 'utf8');
}

function readTextFromFile(filePath: string): Promise<string> {
    return fs.readFile(filePath, 'utf8');
}

export function patch_fs() {
    const myFS: FileSystemImpl = {
        mkDir: (dirPath: string) => fs.mkdir(dirPath, {recursive: true}),
        fileURLToPath: (url) => fileURLToPath(url),
        pathToFileURL: (fsPath) => pathToFileURL(fsPath),

        getFileSize,
        getMimeTypeFromName,
        writeResponseToFile,
        createResponseFromFile,
        getFileStat,

        writeTextToFile, readTextFromFile
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