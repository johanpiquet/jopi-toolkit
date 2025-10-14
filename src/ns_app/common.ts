// noinspection JSUnusedGlobalSymbols

import * as ns_thread from "jopi-node-space/ns_thread";
import * as ns_fs from "jopi-node-space/ns_fs";
import * as ns_timer from "jopi-node-space/ns_timer";
import {isBunJS, isNodeJS} from "jopi-node-space/ns_what";
import {isUsingWorker} from "jopi-node-space/ns_thread";

export type Listener = ()=>void|Promise<void>;

async function execListeners(listeners: Listener[]) {
    const list = [...listeners];
    listeners.splice(0);

    for (const listener of list) {
        try {
            const res = listener();
            if (res instanceof Promise) await res;
        }
        catch (e) {
            console.error(e);
        }
    }
}

const gOnServerSideReady: Listener[] = [];
const gOnAppExiting: Listener[] = [];
const gOnAppExited: Listener[] = [];
const gOnAppStart: Listener[] = [];
let gIsServerSideReady = !(isNodeJS || isBunJS);

let gIsHotReload = globalThis.jopiHotReload !== undefined;
let gIsAppStarted = false;

declare global {
    var jopiHotReload: HotReloadType;
}

export interface HotReloadType {
    onHotReload: Listener[];
    memory: { [key: string]: any };
}

if (gIsHotReload) {
    execListeners(globalThis.jopiHotReload.onHotReload).then();
} else {
    globalThis.jopiHotReload = {
        onHotReload: [],
        memory: {}
    }
}

const gOnHotReload = globalThis.jopiHotReload.onHotReload;
const gMemory = globalThis.jopiHotReload.memory;

export function onServerSideReady(listener: Listener) {
    if (gIsServerSideReady) listener();
    else gOnServerSideReady.push(listener);
}

export function waitServerSideReady() {
    if (gIsServerSideReady) {
        return Promise.resolve();
    }

    return new Promise<void>(r => {
        onServerSideReady(r);
    });
}

export async function declareServerSideReady() {
    gIsServerSideReady = true;
    await execListeners(gOnServerSideReady);
}

export function onAppStart(listener: Listener) {
    if (gIsAppStarted) listener();
    else gOnAppStart.push(listener);
}

export function onAppExiting(listener: Listener) {
    if (gIsExited) listener();
    else gOnAppExiting.push(listener);
}

export function onAppExited(listener: Listener) {
    if (gIsExited) listener();
    else gOnAppExited.push(listener);
}

export async function declareAppStarted() {
    gIsAppStarted = true;
    await execListeners(gOnAppStart);
}

export async function declareAppExiting() {
    if (gIsExited) return;
    gIsExited = true;

    if (isUsingWorker()) {
        // Wait 1 sec, which allows the worker to correctly initialize.
        await ns_timer.tick(1000);
    }

    gIsAppStarted = false;

    await execListeners(gOnAppExiting);

    if (isUsingWorker()) {
        // Allows to worker to correctly stop their activity.
        await ns_timer.tick(100);
    }

    if (!ns_thread.isMainThread) {
        // Allows to worker to correctly stop their activity.
        await ns_timer.tick(50);
    }

    await execListeners(gOnAppExited);
}

export async function executeApp(app: Listener) {
    await waitServerSideReady();
    declareAppStarted();

    try {
        const res = app();
        if (res instanceof Promise) await res;
    }
    finally {
        declareAppExiting();
    }
}

export function onHotReload(listener: Listener) {
    gOnHotReload.push(listener);
}

export function keepOnHotReload<T>(key: string, provider: ()=>T): T {
    let current = gMemory[key];
    if (current!==undefined) return current;
    return gMemory[key] = provider();
}

export function clearHotReloadKey(key: string) {
    delete(gMemory[key]);
}

export function getTempDir(): string {
    if (!gTempDir) {
        gTempDir = ns_fs.resolve(process.cwd(), "temp")!;
    }

    return gTempDir;
}

let gIsExited = false;
let gTempDir: string|undefined;

export function findNodePackageDir(packageName: string, useLinuxPathFormat: boolean = true): string|undefined {
    let currentDir = ns_fs.dirname(findPackageJson());

    while (true) {
        const packagePath = ns_fs.join(currentDir, 'node_modules', packageName);

        if (ns_fs.isDirectorySync(packagePath)) {
            if (useLinuxPathFormat) return ns_fs.win32ToLinuxPath(packagePath);
            return packagePath;
        }

        const parentDir = ns_fs.dirname(currentDir);

        // Reached root directory
        if (parentDir === currentDir) {
            break;
        }

        currentDir = parentDir;
    }

    return undefined;
}

export function requireNodePackageDir(packageName: string, useLinuxPathFormat: boolean = true): string {
    let pkgDir = findNodePackageDir(packageName, useLinuxPathFormat);
    if (!pkgDir) throw new Error("Package '" + packageName + "' not found");
    return pkgDir;
}

export function findPackageJsonDir(searchFromDir = getCodeSourceDirHint()): string {
    let pkgJsonPath = findPackageJson(searchFromDir);
    return ns_fs.dirname(pkgJsonPath);
}

export function findPackageJson(searchFromDir = getCodeSourceDirHint()): string {
    if (!searchFromDir && (gPackageJsonPath!==undefined)) return gPackageJsonPath;

    let currentDir = searchFromDir;

    while (true) {
        const packagePath = ns_fs.join(currentDir, 'package.json');

        if (ns_fs.isFileSync(packagePath)) return gPackageJsonPath = packagePath;

        const parentDir = ns_fs.dirname(currentDir);

        // Reached root directory
        if (parentDir === currentDir) break;

        currentDir = parentDir;
    }

    throw "No package.json found."
}
//
let gPackageJsonPath: string|undefined;

export function setApplicationMainFile(applicationMainFile: string) {
    gApplicationMainFile = applicationMainFile;
    gCodeSourceDirHint = ns_fs.dirname(applicationMainFile);
}

export function getApplicationMainFile(): string|undefined {
    return gApplicationMainFile;
}

export function getCodeSourceDirHint() {
    if (!gCodeSourceDirHint) return process.cwd();
    return gCodeSourceDirHint;
}

export function getSourceCodeDir(): string {
    if (gSourceCodeDir) return gSourceCodeDir;

    let pkgJsonPath = findPackageJson();
    let dirName = ns_fs.join(ns_fs.dirname(pkgJsonPath), "src");

    if (ns_fs.isDirectorySync(dirName)) {
        return gSourceCodeDir = dirName;
    }

    return gSourceCodeDir = ns_fs.dirname(pkgJsonPath);
}

export function getCompiledCodeDir(): string {
    if (gCompiledSourcesDir) return gCompiledSourcesDir;
    const sourceCodeDir = getSourceCodeDir();

    if (!sourceCodeDir.endsWith("src")) {
        return gCompiledSourcesDir = sourceCodeDir;
    }

    // This means that it's Bun.js, and it directly uses the TypeScript version.
    if (gApplicationMainFile && isBunJS && gApplicationMainFile.startsWith(sourceCodeDir)) {
        return gCompiledSourcesDir = sourceCodeDir;
    }

    let pkgJsonPath = findPackageJson();

    let rootDir = ns_fs.dirname(pkgJsonPath);

    for (let toTest of ["dist", "build", "out"]) {
        if (ns_fs.isDirectorySync(ns_fs.join(rootDir, toTest))) {
            return gCompiledSourcesDir = ns_fs.join(rootDir, toTest);
        }
    }

    // No output dir? Assume we compiled on the same dir.
    return rootDir;
}

export function getCompiledFilePathFor(sourceFilePath: string): string {
    const compiledCodeDir = getCompiledCodeDir();
    const sourceCodeDir = getSourceCodeDir();

    if (!sourceFilePath.startsWith(sourceCodeDir)) {
        throw new Error("jopi-loader - The source file must be in the source code directory: " + sourceFilePath);
    }

    let filePath = sourceFilePath.substring(sourceCodeDir.length);

    if (isNodeJS && !filePath.endsWith(".js")) {
        let idx = filePath.lastIndexOf(".");
        if (idx !== -1) filePath = filePath.substring(0, idx) + ".js";
    }

    return ns_fs.join(compiledCodeDir, filePath);
}

export function getSourcesCodePathFor(compiledFilePath: string): string {
    const compiledCodeDir = getCompiledCodeDir();
    const sourceCodeDir = getSourceCodeDir();

    if (!compiledFilePath.startsWith(compiledCodeDir)) {
        throw new Error("jopi-loader - The compiled file must be in the compiled code directory: " + compiledFilePath);
    }

    let filePath =  ns_fs.join(sourceCodeDir, compiledFilePath.substring(compiledCodeDir.length));

    let idx = filePath.lastIndexOf(".");
    if (idx !== -1) filePath = filePath.substring(0, idx);

    if (ns_fs.isFileSync(filePath + ".tsx")) {
        return filePath + ".tsx";
    }

    if (ns_fs.isFileSync(filePath + ".ts")) {
        return filePath + ".ts";
    }

    return filePath + ".js";
}

export function requireSourceOf(scriptPath: string): string {
    let src = searchSourceOf(scriptPath);
    if (!src) throw new Error("Cannot find source of " + scriptPath);
    return src;
}

/**
 * Search the source of the component if it's a JavaScript and not a TypeScript.
 * Why? Because EsBuild doesn't work well on already transpiled code.
 */
export function searchSourceOf(scriptPath: string): string|undefined {
    function tryResolve(filePath: string, outDir: string) {
        let out = ns_fs.sep + outDir + ns_fs.sep;
        let idx = filePath.lastIndexOf(out);

        if (idx !== -1) {
            filePath = filePath.slice(0, idx) + ns_fs.sep + "src" + ns_fs.sep + filePath.slice(idx + out.length);
            if (ns_fs.isFileSync(filePath)) return filePath;
        }

        return undefined;
    }

    let scriptExt = ns_fs.extname(scriptPath);

    if ((scriptExt===".ts") || (scriptExt===".tsx")) {
        // Is already the source.
        return scriptPath;
    }

    const originalScriptPath = scriptPath;
    let isJavascript = (scriptPath.endsWith(".js")||(scriptPath.endsWith(".jsx")));

    if (isJavascript) {
        // Remove his extension.
        scriptPath = scriptPath.slice(0, -scriptExt.length);
    }

    let tryDirs = ["dist", "build"];

    for (let toTry of tryDirs) {
        if (isJavascript) {
            let found = tryResolve(scriptPath + ".tsx", toTry);
            if (found) return found;

            found = tryResolve(scriptPath + ".ts", toTry);
            if (found) return found;
        } else {
            let found = tryResolve(scriptPath, toTry);
            if (found) return found;
        }
    }

    return originalScriptPath;
}

let gSourceCodeDir: string|undefined;
let gCodeSourceDirHint: string|undefined;
let gApplicationMainFile: string|undefined;
let gCompiledSourcesDir: string|undefined;
