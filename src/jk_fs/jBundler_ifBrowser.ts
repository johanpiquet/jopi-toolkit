// noinspection JSUnusedLocalSymbols

export const md5 = () => { throw new Error("Not implemented") };

import type {DirItem, FileState} from "./common.ts";

export async function writeResponseToFile(response: Response, filePath: string, createDir: boolean = true) {
    throw new Error("Not implemented");
}

export function nodeStreamToWebStream(nodeStream: any, debugInfos?: string): ReadableStream {
    throw new Error("Not implemented");
}

export function webStreamToNodeStream(webStream: ReadableStream): any {
    throw new Error("Not implemented");
}

export function createResponseFromFile(filePath: string, status: number = 200, headers?: {[key: string]: string}|Headers): Response {
    throw new Error("Not implemented")
}

export async function getFileSize(filePath: string): Promise<number> {
    throw new Error("Not implemented");
}

export async function getFileStat(filePath: string): Promise<FileState|undefined> {
    throw new Error("Not implemented");
}

export function getMimeTypeFromName(fileName: string) {
    throw new Error("Not implemented");
}

export async function mkDir(dirPath: string): Promise<boolean> {
    throw new Error("Not implemented");
}

export async function rmDir(dirPath: string): Promise<boolean> {
    throw new Error("Not implemented");
}

export function fileURLToPath(url: string) {
    throw new Error("Not implemented");
}

export function pathToFileURL(url: string) {
    throw new Error("Not implemented");
}

export async function unlink(filePath: string): Promise<boolean> {
    throw new Error("Not implemented");
}

export async function writeTextToFile(filePath: string, text: string, createDir: boolean = true): Promise<void> {
    throw new Error("Not implemented");
}

export function writeTextToFileSync(filePath: string, text: string, createDir: boolean = true): void {
    throw new Error("Not implemented");
}

export function readTextFromFile(filePath: string): Promise<string> {
    throw new Error("Not implemented");
}

export function readTextFromFileSync(filePath: string): string {
    throw new Error("Not implemented");
}

export async function isFile(filePath: string): Promise<boolean> {
    throw new Error("Not implemented");
}

export async function isDirectory(filePath: string): Promise<boolean> {
    throw new Error("Not implemented");
}

export function isDirectorySync(dirPath: string) {
    throw new Error("Not implemented");
}

export function isFileSync(dirPath: string) {
    throw new Error("Not implemented");
}

export async function readFileToBytes(filePath: string): Promise<Uint8Array> {
    throw new Error("Not implemented");
}

export function getRelativePath(fromDir: string, absolutePath: string) {
    throw new Error("Not implemented");
}

export async function listDir(dirPath: string): Promise<DirItem[]> {
    throw new Error("Not implemented");
}

/**
 * Convert a simple win32 path to a linux path.
 */
export function win32ToLinuxPath(filePath: string): string {
    return filePath.replace(/\\/g, '/');
}

export const join = () => { throw new Error("Not implemented"); }
export const resolve = () => { throw new Error("Not implemented"); }
export const dirname = () => { throw new Error("Not implemented"); }
export const extname = () => { throw new Error("Not implemented"); }

export const sep = "/";
export const isAbsolute = () => { throw new Error("Not implemented"); }
export const normalize = () => { throw new Error("Not implemented"); }
export const basename = () => { throw new Error("Not implemented"); }
export const rename = () => { throw new Error("Not implemented"); }
export const symlink = () => { throw new Error("Not implemented"); }