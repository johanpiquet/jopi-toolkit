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
    os: OsImpl;
    timer: TimerImpl;
    app: AppImpl;
    extensionPoints: ExtensionPointImpl;
    term: TerminalImpl;
    webSocket: WebSocketImpl;

    // >>> Server side only

    fs: FileSystemImpl;
    crypto: CryptoImpl;
    compress: CompressImpl;
    stream: StreamImpl;

    // >>> Tools

    applyDefaults<T>(source: T|undefined, defaults: T): T;
    getErrorMessage(e: unknown): string;
}

// ********************************************

export interface WebSocketImpl {
    /**
     * Open a connection to a server.
     * The url must be of the type "ws://host-name:optionalPort/optionalPath".
     * Ex: "ws://127.0.0.1:3000/my-end-point".
     */
    openConnection(wsUrl: string, protocol?: string|string[]): Promise<WebSocket>;

    /**
     * Is called when the socket is closed.
     */
    sendMessage(socket: WebSocket, msg: string|Buffer|Uint8Array|ArrayBuffer): void;

    /**
     * Send a text message through this webSocket.
     */
    onMessage(socket: WebSocket, listener: ((msg: string|Buffer) => void)): void;

    /**
     * Add a listener which is called when the socket receives a message.
     */
    onClosed(socket: WebSocket, listener: () => void): void;

    /**
     * Add a listener which is called when an error occurs.
     */
    onError(socket: WebSocket, listener: () => void): void;
}

export interface CompressImpl {
    gunzipSync(data: Uint8Array|string): Uint8Array;
    gzipSync(data: Uint8Array|string): Uint8Array;
}

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

export interface OsImpl {
    exec(command: string): Promise<void>;
    which(toolName: string): Promise<string|null>;
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

    chrono(mustSaveMeasures: boolean): Chrono;
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

export interface StreamImpl {
    teeResponse(response: Response): Promise<[ReadableStream, Response]>;
}

export interface FileSystemImpl {
    mkDir: (dirPath: string) => Promise<void>;
    rmDir: (dirPath: string) => Promise<void>;

    fileURLToPath: (url: string) => string;
    pathToFileURL: (fsPath: string) => URL;

    getMimeTypeFromName: (fileName: string) => string;
    getFileSize: (filePath: string) => Promise<number>;
    getFileStat: (filePath: string) => Promise<FileState|undefined>;

    writeResponseToFile: (response: Response, filePath: string, createDir?: boolean) => Promise<void>;
    createResponseFromFile: (filePath: string, status?: number, headers?: {[key: string]: string}|Headers) => Response;

    unlink(filePath: string): Promise<void>;

    writeTextToFile(filePath: string, text: string, createDir?: boolean): Promise<void>;
    writeTextSyncToFile(filePath: string, text: string, createDir?: boolean): void;

    readTextFromFile(filePath: string): Promise<string>;
    readTextSyncFromFile(filePath: string): string;

    isFile(filePath: string): Promise<boolean>;
    isDirectory(dirPath: string): Promise<boolean>;

    readFileToBytes(filePath: string): Promise<Uint8Array>;

    nodeStreamToWebStream(nodeStream: NodeJS.ReadableStream): ReadableStream;
    webStreamToNodeStream(webStream: ReadableStream): NodeJS.ReadableStream
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
     * Build a console.log function that uses the colors provided in params.
     */
    buildLogger: (...colors: string[]) => TermLogger;

    /**
     * Build a console.log function that uses the colors provided in params.
     */
    buildWriter: (...colors: string[]) => ((...params: any[])=>string);

    /**
     * Indent a multiline text.
     */
    indentText: (space: string, text: string) => string;

    /**
     * Write a temporary message, which are replaced each time by the next temp message.
     */
    consoleLogTemp: (isTemp: boolean, text: string) => void,

    logRed: TermLogger,
    logBgRed: TermLogger,

    logGreen: TermLogger,
    logBgGreen: TermLogger,

    logBlue: TermLogger,
    logBgBlue: TermLogger,

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
    C_WHITE: string;

    B_BLACK: string;
    B_RED: string;
    B_GREEN: string;
    B_YELLOW: string;
    B_BLUE: string;
    B_MAGENTA: string;
    B_CYAN: string;
    B_WHITE: string;
}

export interface CryptoImpl {
    fastHash(text: string): string;
    md5(text: string): string;
}

// ********************************

export type TermLogger = (...args: any[]) => void;

export interface Chrono {
    lastMeasure?: ChronoMeasure;
    allMeasures: ChronoMeasure[];

    start(label: string, printTitle?: string): void;
    start_withLimit(limit_ms: number, label: string, printTitle?: string): void;

    end(): void;

    onMeasureDone(handler: null | ((measure: ChronoMeasure) => void)): void;
}

export interface ChronoMeasure {
    label?: string;
    title?: string;
    logIfMoreThan_ms?: number;

    startTime_ms: number;
    endTime_ms: number;
    elapsedTime_ms: number;
    elapsedTime_sec: string;
}