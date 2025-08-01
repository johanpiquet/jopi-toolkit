declare global {
    var NodeSpace: NodeSpaceType;
    var jopiHotReloader: HotReloadType;
}

globalThis.NodeSpace = {} as NodeSpaceType;

let _isBunJs = false;
let _isNodeJs = false;

export async function execListeners(listeners: Listener[]) {
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

export function isServerSide(): boolean {
    return isBunJs() || isNodeJs();
}

export function isBunJs(): boolean {
    if (_isBunJs) return _isBunJs;
    return _isBunJs = typeof(Bun)!=="undefined";
}

export function isNodeJs(): boolean {
    if (_isNodeJs) return _isNodeJs;
    return _isNodeJs = typeof(self)==="undefined";
}

export function tick(delayMs: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, delayMs));
}

export type ServerType = "nodejs"|"bunjs"|"browser";
export type Listener = ()=>void|Promise<void>;

export interface NodeSpaceType {
    what: WhatInfos;
    thread: ThreadImpl;
    process: ProcessImpl;
    timer: TimerImpl;
    app: AppImpl;
    fs?: FileSystemImpl;
    extensionPoints?: ExtensionPointImpl;
}

export interface HotReloadType {
    onHotReload: Listener[];
    memory: { [key: string]: any };
}

interface WhatInfos {
    isNodeJS: boolean;
    isBunJs: boolean;
    isBrowser: boolean;
    isServerSide: boolean;
    serverType: ServerType;
}

interface ThreadImpl {
    isMainThread: boolean;
    currentWorker: Worker | null;
    newWorker: (fileName: string | URL, data?: any) => Worker;
    getCurrentWorkerData: ()=>any;
    unrefThisWorker(worker: Worker): void;
    closeCurrentThread(): void;
}

interface ProcessImpl {
    argv: string[];
    env: { [key: string]: string };
    isProduction: boolean;
}

interface TimerImpl {
    tick: (delayMs: number) => Promise<void>;
}

interface FileSystemImpl {
    mkDir: (dirPath: string) => Promise<string | undefined>;
}

interface AppImpl {
    onServerSideReady(listener: Listener): void;
    waitServerSideReady: () => Promise<void>;
    declareServerSideReady(): void;

    onAppStart(listener: Listener): void;
    onAppExiting(listener: Listener): void;
    onAppExited(listener: Listener): void;
    executeApp(app: Listener): void;
    declareAppStarted(): void;
    declareAppExiting(): void;

    onHotReload(listener: Listener): void;
    keepOnHotReload<T>(key: string, provider: ()=>T): T;
}

export type EpCaller = (...values:  unknown[]) => Promise<void>;
export type EpListener = (...values:  unknown[]) => void|Promise<void>;

interface ExtensionPointImpl {
    /**
     * Register an extension point.
     * Allow knowing who is using it as an host.
     */
    newHost(epName: string, importMetaUrl: string): EpCaller;

    /**
     * Get a caller, allowing to call the extension point.
     */
    getCaller(epName: string, importMetaUrl: string): EpCaller;

    /**
     * Add a function which is called when the extension point is called.
     */
    on(epName: string, importMetaUrl: string, fct: EpListener): void;
}