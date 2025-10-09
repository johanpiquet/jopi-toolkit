import fs from "node:fs/promises";
import fss, {stat} from "node:fs";
import {fileURLToPath} from "url";
import {isBunJs} from "./common.ts";
import {pathToFileURL} from "node:url";
import { lookup } from "mime-types";
import {Readable} from "node:stream";
import {createReadStream} from "node:fs";
import type {DirItem, FileState, FileSystemImpl} from "./__global.ts";
import {merge} from "./internal.ts";
import path from "node:path";
import {getInstance} from "./instance.ts";

const NodeSpace = getInstance();

//region Node.js adapter

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

async function writeResponseToFile(response: Response, filePath: string, createDir: boolean = true) {
    if (createDir) await mkDirRec(path.dirname(filePath));
    const bufferDonnees = await response.arrayBuffer();
    const bufferNode = Buffer.from(bufferDonnees);
    await fs.writeFile(filePath, bufferNode);
}

function nodeStreamToWebStream(nodeStream: Readable, debugInfos?: string): ReadableStream {
        return new ReadableStream({
            start(controller) {
                nodeStream.on('data', (chunk: Buffer) => {
                    try { controller.enqueue(chunk); }
                    catch(e) {
                        if (debugInfos) {
                            console.log("nodeStreamToWebStream - unexpected stream closed for " + debugInfos, e);
                        }
                    }
                });

                nodeStream.on('end', () => {
                    try {controller.close();}
                    catch(e) {
                        if (debugInfos) {
                            console.log("nodeStreamToWebStream - unexpected stream closed for " + debugInfos, e);
                        }
                    }
                });

                nodeStream.on('error', (err) => {
                    controller.error(err);
                });
            }
        });
}

function webStreamToNodeStream(webStream: ReadableStream): Readable {
    return new WebToNodeReadableStreamAdapter(webStream);
}

function createResponseFromFile(filePath: string, status: number = 200, headers?: {[key: string]: string}|Headers): Response {
    const nodeReadStream = createReadStream(filePath);
    const webReadableStream = nodeStreamToWebStream(nodeReadStream, filePath);
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

async function rmDirRec(dirPath: string): Promise<void> {
    try { await fs.rm(dirPath, {recursive: true, force: true}); }
    catch {}
}

async function writeTextToFile(filePath: string, text: string, createDir: boolean = true): Promise<void> {
    if (createDir) await mkDirRec(path.dirname(filePath));
    await fs.writeFile(filePath, text, {encoding: 'utf8', flag: 'w'});
}

function writeTextSyncToFile(filePath: string, text: string, createDir: boolean = true): void {
    if (createDir) {
        try {
            fss.mkdirSync(path.dirname(filePath), {recursive: true});
        } catch {}
    }
    fss.writeFileSync(filePath, text, {encoding: 'utf8', flag: 'w'});
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

function isDirectorySync(dirPath: string) {
    try {
        const stats = fss.statSync(dirPath);
        return stats.isDirectory();
    }
    catch {
    }

    return false;
}

function isFileSync(dirPath: string) {
    try {
        const stats = fss.statSync(dirPath);
        return stats.isFile();
    }
    catch {
    }

    return false;
}

async function readFileToBytes(filePath: string): Promise<Uint8Array> {
    const buffer = await fs.readFile(filePath);
    return new Uint8Array(buffer);
}

function getRelativePath(absolutePath: string, fromPath: string = process.cwd()) {
    return path.relative(fromPath, absolutePath);
}

async function listDir(dirPath: string): Promise<DirItem[]> {
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

export function patch_fs() {
    const myFS: FileSystemImpl = {
        mkDir: mkDirRec,
        rmDir: rmDirRec,
        fileURLToPath: (url) => fileURLToPath(url),
        pathToFileURL: (fsPath) => pathToFileURL(fsPath),
        unlink: (filePath) => fs.unlink(filePath),

        getFileSize,
        getMimeTypeFromName,
        writeResponseToFile,
        createResponseFromFile,
        getFileStat,
        readFileToBytes,

        nodeStreamToWebStream, webStreamToNodeStream,

        writeTextToFile, writeTextSyncToFile,
        readTextFromFile, readTextSyncFromFile,

        isFile, isFileSync,
        isDirectory, isDirectorySync,

        getRelativePath,
        listDir,

        join: path.join,
        resolve: path.resolve,
        dirname: path.dirname,
        extname: path.extname,

        sep: path.sep,
        isAbsolute: path.isAbsolute,
        normalize: path.normalize,
        basename: path.basename,

        /**
         * Convert a simple win32 path to a linux path.
         */
        win32ToLinuxPath(filePath) {
            return filePath.replace(/\\/g, '/');
        }
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