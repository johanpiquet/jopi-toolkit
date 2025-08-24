import fs from "node:fs/promises";
import fss from "node:fs";
import { fileURLToPath } from "url";
import { isBunJs } from "./common.js";
import { pathToFileURL } from "node:url";
import { lookup } from "mime-types";
import { Readable } from "node:stream";
import { createReadStream } from "node:fs";
import { merge } from "./internal.js";
import path from "node:path";
//region Node.js adapter
class WebToNodeReadableStreamAdapter extends Readable {
    webStreamReader;
    constructor(webStream) {
        super();
        this.webStreamReader = webStream.getReader();
    }
    _read() {
        this.webStreamReader.read().then(({ done, value }) => {
            if (done) {
                this.push(null);
                return;
            }
            const buffer = Buffer.from(value);
            if (!this.push(buffer))
                this.webStreamReader.cancel().then();
        }).catch(err => {
            this.destroy(err);
        });
    }
    _destroy(err, callback) {
        this.webStreamReader.cancel().finally(() => { callback(err); });
    }
}
async function writeResponseToFile(response, filePath, createDir = true) {
    if (createDir)
        await mkDirRec(path.dirname(filePath));
    const bufferDonnees = await response.arrayBuffer();
    const bufferNode = Buffer.from(bufferDonnees);
    await fs.writeFile(filePath, bufferNode);
}
function nodeStreamToWebStream(nodeStream) {
    return new ReadableStream({
        start(controller) {
            nodeStream.on('data', (chunk) => { controller.enqueue(chunk); });
            nodeStream.on('end', () => { controller.close(); });
            nodeStream.on('error', (err) => { controller.error(err); });
        }
    });
}
function webStreamToNodeStream(webStream) {
    return new WebToNodeReadableStreamAdapter(webStream);
}
function createResponseFromFile(filePath, status = 200, headers) {
    const nodeReadStream = createReadStream(filePath);
    const webReadableStream = nodeStreamToWebStream(nodeReadStream);
    return new Response(webReadableStream, { status: status, headers: headers });
}
async function getFileSize(filePath) {
    try {
        return (await fs.stat(filePath)).size;
    }
    catch {
        return 0;
    }
}
async function getFileStat(filePath) {
    try {
        return await fs.stat(filePath);
    }
    catch {
        return undefined;
    }
}
//endregion
function getMimeTypeFromName(fileName) {
    const found = lookup(fileName);
    if (found === false)
        return "";
    return found;
}
async function mkDirRec(dirPath) {
    try {
        await fs.mkdir(dirPath, { recursive: true });
    }
    catch { }
}
async function rmDirRec(dirPath) {
    try {
        await fs.rm(dirPath, { recursive: true, force: true });
    }
    catch { }
}
async function writeTextToFile(filePath, text, createDir = true) {
    if (createDir)
        await mkDirRec(path.dirname(filePath));
    await fs.writeFile(filePath, text, { encoding: 'utf8', flag: 'w' });
}
function readTextFromFile(filePath) {
    return fs.readFile(filePath, 'utf8');
}
function readTextSyncFromFile(filePath) {
    return fss.readFileSync(filePath, 'utf8');
}
async function isFile(filePath) {
    const stats = await getFileStat(filePath);
    if (!stats)
        return false;
    return stats.isFile();
}
async function isDirectory(filePath) {
    const stats = await getFileStat(filePath);
    if (!stats)
        return false;
    return stats.isDirectory();
}
async function readFileToBytes(filePath) {
    const buffer = await fs.readFile(filePath);
    return new Uint8Array(buffer);
}
export function patch_fs() {
    const myFS = {
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
        writeTextToFile, readTextFromFile, readTextSyncFromFile,
        isFile, isDirectory
    };
    if (isBunJs()) {
        myFS.fileURLToPath = (url) => Bun.fileURLToPath(url);
        myFS.pathToFileURL = (fsPath) => Bun.pathToFileURL(fsPath);
        myFS.writeResponseToFile = async (r, p) => { await Bun.file(p).write(r); };
        myFS.createResponseFromFile = (filePath, status, headers) => new Response(Bun.file(filePath), { status, headers });
        myFS.readFileToBytes = async (filePath) => Bun.file(filePath).bytes();
    }
    merge(NodeSpace.fs, myFS);
}
//# sourceMappingURL=_fs_s.js.map