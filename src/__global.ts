declare global {
    var NodeSpace: NodeSpaceType;
    var jopiHotReload: HotReloadType;
}

globalThis.NodeSpace = {} as NodeSpaceType;

export type ServerType = "nodejs"|"bunjs"|"browser";
export type Listener = ()=>void|Promise<void>;

export type EpCaller = (...values:  unknown[]) => Promise<void>;
export type EpListener = (...values:  unknown[]) => void|Promise<void>;

// ********************************************

export interface NodeSpaceType {
    what: WhatInfos;
    thread: ThreadImpl;
    process: ProcessImpl;
    timer: TimerImpl;
    app: AppImpl;
    extensionPoints: ExtensionPointImpl;
    term: TerminalImpl;

    // >>> Server side only

    fs: FileSystemImpl;

    // >>> Tools

    applyDefaults<T>(source: T|undefined, defaults: T): T;
}

// ********************************************

export interface HotReloadType {
    onHotReload: Listener[];
    memory: { [key: string]: any };
}

export interface WhatInfos {
    isNodeJS: boolean;
    isBunJs: boolean;
    isBrowser: boolean;
    isServerSide: boolean;
    serverType: ServerType;
}

export interface ThreadImpl {
    isMainThread: boolean;
    currentWorker: Worker | null;
    newWorker: (fileName: string | URL, data?: any) => Worker;
    getCurrentWorkerData: ()=>any;
    unrefThisWorker(worker: Worker): void;
    closeCurrentThread(): void;
}

export interface ProcessImpl {
    argv: string[];
    env: { [key: string]: string };
    isProduction: boolean;
}

export type TimerCallback = () => void|boolean|Promise<void|boolean>;

export interface TimerImpl {
    ONE_SECOND: number,
    ONE_MINUTE: number,
    ONE_HOUR: number,
    ONE_DAY: number,

    tick: (delayMs: number) => Promise<void>;
    newInterval: (durationInMs: number, callback: TimerCallback) => void;
    deferred: (callback: ()=>void) => void;
}

export interface FileState {
    size: number,

    mtimeMs: number,
    ctimeMs: number,
    birthtimeMs: number,

    isDirectory: () => boolean,
    isFile: () => boolean,
    isSymbolicLink: () => boolean,
}

export interface FileSystemImpl {
    mkDir: (dirPath: string) => Promise<string | undefined>;
    fileURLToPath: (url: string) => string;
    pathToFileURL: (fsPath: string) => URL;

    getMimeTypeFromName: (fileName: string) => string;
    getFileSize: (filePath: string) => Promise<number>;
    getFileStat: (filePath: string) => Promise<FileState>;

    writeResponseToFile: (response: Response, filePath: string) => Promise<void>;
    createResponseFromFile: (filePath: string, status?: number, headers?: {[key: string]: string}|Headers) => Response;
}

export interface AppImpl {
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
    clearHotReloadKey: (key: string) => void;
}

export interface ExtensionPointImpl {
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

export interface TerminalImpl {
    colorize: (...params: string[]) => string;
    cssText: (text: string, css: string) => void;

    moveUp: (n: number) => string;
    moveDown: (n: number) => string;
    moveLeft: (n: number) => string;
    moveRight: (n: number) => string;
    goAt: (x: number, y: number) => string;

    /**
     * Write a temporary message, which are replaced each time by the next temp message.
     */
    consoleLogTemp: (isTemp: boolean, ...args: unknown[]) => void,

    T_RESET: string;
    T_BOLD: string;
    T_UNDERLINE: string;
    T_REWRITE_LINE: string;
    T_CLEAR_LINE: string;
    T_CLEAR_LINE_END: string;
    T_CLEAR_SCREEN: string;
    T_LINE_START: string;

    C_RED: string;
    C_GREEN: string;
    C_BLUE: string;
    C_LIGHT_BLUE: string;
    C_GREY: string;
    C_ORANGE: string;

    B_BLACK: string;
    B_RED: string;
    B_GREEN: string;
    B_YELLOW: string;
    B_BLUE: string;
    B_MAGENTA: string;
    B_CYAN: string;
    B_WHITE: string;
}