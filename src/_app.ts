import {execListeners, isBunJs, isNodeJs} from "./common.ts";
import {isUsingWorker} from "./internal.ts";
import type {Listener} from "./__global.ts";
import {getInstance} from "./instance.ts";

const NodeSpace = getInstance();

export function init_nodeSpaceApp() {
    const onServerSideReady: Listener[] = [];
    const onAppExiting: Listener[] = [];
    const onAppExited: Listener[] = [];
    const onAppStart: Listener[] = [];
    let isServerSideReady = !(isNodeJs() || isBunJs());

    let isHotReload = globalThis.jopiHotReload !== undefined;
    let gIsAppStarted = false;

    if (isHotReload) {
        execListeners(globalThis.jopiHotReload.onHotReload).then();
    } else {
        globalThis.jopiHotReload = {
            onHotReload: [],
            memory: {}
        }
    }

    const onHotReload = globalThis.jopiHotReload.onHotReload;
    const memory = globalThis.jopiHotReload.memory;

    getInstance().app = {
        onServerSideReady: (listener) => {
            if (isServerSideReady) listener();
            else onServerSideReady.push(listener);
        },

        waitServerSideReady: () => {
            if (isServerSideReady) {
                return Promise.resolve();
            }

            return new Promise<void>(r => {
                NodeSpace.app.onServerSideReady(r);
            })
        },

        declareServerSideReady: async () => {
            isServerSideReady = true;
            await execListeners(onServerSideReady);
        },

        onAppStart: (listener: Listener) => {
            if (gIsAppStarted) listener();
            else onAppStart.push(listener);
        },

        onAppExiting: (listener: Listener) => {
            if (gIsExited) listener();
            else onAppExiting.push(listener);
        },

        onAppExited: (listener: Listener) => {
            if (gIsExited) listener();
            else onAppExited.push(listener);
        },

        declareAppStarted: async () => {
            gIsAppStarted = true;
            await execListeners(onAppStart);
        },

        declareAppExiting: async () => {
            if (gIsExited) return;
            gIsExited = true;

            if (isUsingWorker()) {
                // Wait 1 sec, which allows the worker to correctly initialize.
                await NodeSpace.timer.tick(1000);
            }

            gIsAppStarted = false;

            await execListeners(onAppExiting);

            if (isUsingWorker()) {
                // Allows to worker to correctly stop their activity.
                await NodeSpace.timer.tick(100);
            }

            if (!NodeSpace.thread.isMainThread) {
                // Allows to worker to correctly stop their activity.
                await NodeSpace.timer.tick(50);
            }

            await execListeners(onAppExited);
        },

        executeApp: async (app) => {
            await NodeSpace.app.waitServerSideReady();
            NodeSpace.app.declareAppStarted();

            try {
                const res = app();
                if (res instanceof Promise) await res;
            }
            finally {
                NodeSpace.app.declareAppExiting();
            }
        },

        onHotReload(listener: Listener) {
            onHotReload.push(listener);
        },

        keepOnHotReload: (key, provider) => {
            let current = memory[key];
            if (current!==undefined) return current;
            return memory[key] = provider();
        },

        clearHotReloadKey: (key) => {
            delete(memory[key]);
        },

        getTempDir() {
            if (!gTempDir) {
                gTempDir = NodeSpace.fs.resolve(process.cwd(), "temp");
            }

            return gTempDir;
        },

        findPackageJson,
        setApplicationMainFile,
        getApplicationMainFile,
        getCompiledFilePathFor,
        getSourcesCodePathFor,
        getSourceCodeDir,
        getCompiledCodeDir,
        searchSourceOf, requireSourceOf
    };
}

let gIsExited = false;
let gTempDir: string|undefined;

export function findPackageJson(searchFromDir = getCodeSourceDirHint()): string {
    if (gPackageJsonPath!==undefined) return gPackageJsonPath;

    let currentDir = searchFromDir;

    while (true) {
        const packagePath = NodeSpace.fs.join(currentDir, 'package.json');

        if (NodeSpace.fs.isFileSync(packagePath)) return gPackageJsonPath = packagePath;

        const parentDir =  NodeSpace.fs.dirname(currentDir);

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
    gCodeSourceDirHint = NodeSpace.fs.dirname(applicationMainFile);
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
    let dirName = NodeSpace.fs.join(NodeSpace.fs.dirname(pkgJsonPath), "src");

    if (NodeSpace.fs.isDirectorySync(dirName)) {
        return gSourceCodeDir = dirName;
    }

    return gSourceCodeDir = NodeSpace.fs.dirname(pkgJsonPath);
}

export function getCompiledCodeDir(): string {
    if (gCompiledSourcesDir) return gCompiledSourcesDir;
    const sourceCodeDir = getSourceCodeDir();

    if (!sourceCodeDir.endsWith("src")) {
        return gCompiledSourcesDir = sourceCodeDir;
    }

    // This means that it's Bun.js, and it directly uses the TypeScript version.
    if (gApplicationMainFile && NodeSpace.what.isBunJs && gApplicationMainFile.startsWith(sourceCodeDir)) {
        return gCompiledSourcesDir = sourceCodeDir;
    }

    let pkgJsonPath = findPackageJson();

    let rootDir = NodeSpace.fs.dirname(pkgJsonPath);

    for (let toTest of ["dist", "build", "out"]) {
        if (NodeSpace.fs.isDirectorySync(NodeSpace.fs.join(rootDir, toTest))) {
            return gCompiledSourcesDir = NodeSpace.fs.join(rootDir, toTest);
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

    if (!filePath.endsWith(".js")) {
        let idx = filePath.lastIndexOf(".");
        if (idx !== -1) filePath = filePath.substring(0, idx) + ".js";
    }

    return NodeSpace.fs.join(compiledCodeDir, filePath);
}

export function getSourcesCodePathFor(compiledFilePath: string): string {
    const compiledCodeDir = getCompiledCodeDir();
    const sourceCodeDir = getSourceCodeDir();

    if (!compiledFilePath.startsWith(compiledCodeDir)) {
        throw new Error("jopi-loader - The compiled file must be in the compiled code directory: " + compiledFilePath);
    }

    let filePath =  NodeSpace.fs.join(sourceCodeDir, compiledFilePath.substring(compiledCodeDir.length));

    let idx = filePath.lastIndexOf(".");
    if (idx !== -1) filePath = filePath.substring(0, idx);

    if (NodeSpace.fs.isFileSync(filePath + ".tsx")) {
        return filePath + ".tsx";
    }

    if (NodeSpace.fs.isFileSync(filePath + ".ts")) {
        return filePath + ".ts";
    }

    return filePath + ".js";
}

function requireSourceOf(scriptPath: string): string {
    let src = searchSourceOf(scriptPath);
    if (!src) throw new Error("Cannot find source of " + scriptPath);
    return src;
}

/**
 * Search the source of the component if it's a JavaScript and not a TypeScript.
 * Why? Because EsBuild doesn't work well on already transpiled code.
 */
function searchSourceOf(scriptPath: string): string|undefined {
    function tryResolve(filePath: string, outDir: string) {
        let out = nFS.sep + outDir + nFS.sep;
        let idx = filePath.lastIndexOf(out);

        if (idx !== -1) {
            filePath = filePath.slice(0, idx) + nFS.sep + "src" + nFS.sep + filePath.slice(idx + out.length);
            if (NodeSpace.fs.isFileSync(filePath)) return filePath;
        }

        return undefined;
    }

    const nFS = NodeSpace.fs;
    let scriptExt = nFS.extname(scriptPath);

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
