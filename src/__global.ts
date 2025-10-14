declare global {
    var jopiHotReload: HotReloadType;
}

export type ServerType = "nodejs"|"bunjs"|"browser";
export type Listener = ()=>void|Promise<void>;

export type EpCaller = (...values:  unknown[]) => Promise<void>;
export type EpListener = (...values:  unknown[]) => void|Promise<void>;

// ********************************************

export interface NodeSpaceType {
    nodeSpaceVersion: string,
    nodeLibPath: string,

    what: WhatInfos;
    app: AppImpl;
    term: TerminalImpl;
    webSocket: WebSocketImpl;

    // >>> Server side only

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


export interface StreamImpl {
    teeResponse(response: Response): Promise<[ReadableStream, Response]>;
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

    getTempDir(): string;

    /**
     * Search the package.json file for the currently executing script.
     * Use the current working dir and search in parent directories.
     *
     * @return - Returns the full path of the file 'package.json'.
     * Throw an exception if not found.
     */
    findPackageJson(searchFromDir?: string): string;

    findNodePackageDir(packageName: string, useLinuxPathFormat?: boolean): string|undefined;
    requireNodePackageDir(packageName: string, useLinuxPathFormat?: boolean): string;

    setApplicationMainFile(applicationMainFile: string): void;
    getApplicationMainFile(): string|undefined;

    getCompiledFilePathFor(sourceFilePath: string): string;
    getSourcesCodePathFor(compiledFilePath: string): string;
    
    getSourceCodeDir(): string;
    getCompiledCodeDir(): string;

    searchSourceOf(scriptPath: string): string|undefined;
    requireSourceOf(scriptPath: string): string;
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

    /**
     * Print a console message, where the user must respond by yes (y) or no (n).
     */
    askYesNo(message: string, defaultValue: boolean): Promise<boolean>;

    logSuccess: TermLogger;
    logError: TermLogger;
    logWarn: TermLogger;

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

// ********************************

export type TermLogger = (...args: any[]) => void;

