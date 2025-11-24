// noinspection JSUnusedGlobalSymbols

import * as jk_terms from "jopi-toolkit/jk_term";

//region Common

export interface LogEntry {
    level: LogLevel;
    logger: string;

    date: number;
    title?: string;
    data?: any;

    timeDif?: number;
}

export type LogEntryFormater = (entry: LogEntry)=>string;

export enum LogLevel {
    SPAM = 8,
    INFO = 4,
    WARN = 2,
    ERROR = 0,
}

export type LogCall = string | ((w: LogLevelHandler)=>void);

//endregion

//region Formater

const RED = jk_terms.C_RED;
const ORANGE = jk_terms.C_ORANGE;
const GREY = jk_terms.C_GREY;
const LIGHT_BLUE = jk_terms.C_LIGHT_BLUE;
const RESET = jk_terms.T_RESET;

export function formatDate1(timeStamp: number): string {
    const date = new Date(timeStamp);
    return date.toISOString();
}

export const formater_simpleJson: LogEntryFormater = (entry: LogEntry) => {
    return JSON.stringify(entry);
};

export const formater_dateTypeTitleSourceData: LogEntryFormater = (entry: LogEntry) => {
    const date = formatDate1(entry.date);

    let json = entry.data ? JSON.stringify(entry.data) : "";
    const title = (entry.title || "").padEnd(50, " ");

    json = entry.logger + " |>" + json;

    switch (entry.level) {
        case LogLevel.ERROR:
            return `${date} - ERROR - ${title}${json}`;
        case LogLevel.WARN:
            return `${date} - WARN  - ${title}${json}`;
        case LogLevel.INFO:
            return `${date} - INFO  - ${title}${json}`;
        case LogLevel.SPAM:
            return `${date} - SPAM  - ${title}${json}`;
    }
}

export const formater_typeTitleSourceData_colored: LogEntryFormater = (entry: LogEntry) => {
    let json = entry.data ? JSON.stringify(entry.data) : "";
    const title = (entry.title || "").padEnd(50, " ");

    json = entry.timeDif === undefined
        ? `${entry.logger} ${json}` : `${entry.logger} (${entry.timeDif} ms) ${json}`;

    switch (entry.level) {
        case LogLevel.ERROR:
            return `${RED}error${RESET} - ${title}${GREY}${json}${RESET}`;
        case LogLevel.WARN:
            return `${ORANGE}warn ${RESET} - ${title}${GREY}${json}${RESET}`;
        case LogLevel.INFO:
            return `${LIGHT_BLUE}info ${RESET} - ${title}${GREY}${json}${RESET}`;
        case LogLevel.SPAM:
            return `${GREY}spam ${RESET} - ${title}${GREY}${json}${RESET}`;
    }
}

//endregion

//region LogWriter

export interface LogWriter {
    addEntry(entry: LogEntry): void;
    addBatch(entries: LogEntry[]): void;
}

class ConsoleLogWriter implements LogWriter {
    constructor(private readonly formater: LogEntryFormater = gDefaultFormater) {
    }

    addEntry(entry: LogEntry): void {
        console.log(this.formater(entry));
    }

    addBatch(entries: LogEntry[]) {
        entries.forEach(e => this.addEntry(e));
    }
}

export class VoidLogWriter implements LogWriter {
    addBatch(_entries: LogEntry[]): void {
    }

    addEntry(_entry: LogEntry): void {
    }
}

export function setDefaultWriter(writer: LogWriter) {
    gDefaultWriter = writer;
}

export function getDefaultWriter(): LogWriter {
    return gDefaultWriter;
}

export function setDefaultFormater(formater: LogEntryFormater) {
    gDefaultFormater = formater;
}

export function getDefaultFormater(): LogEntryFormater {
    return gDefaultFormater;
}

let gDefaultFormater: LogEntryFormater = formater_typeTitleSourceData_colored;
let gDefaultWriter: LogWriter = new ConsoleLogWriter();

//endregion

//region JopiLogger

export abstract class JopiLogger {
    readonly #fullName: string;
    #onLog: LogWriter = gDefaultWriter;

    protected readonly hSpam: LogLevelHandler;
    protected readonly hInfo: LogLevelHandler;
    protected readonly hWarn: LogLevelHandler;
    protected readonly hError: LogLevelHandler;

    private timeDif?: number;

    constructor(parent: JopiLogger|null, public readonly name: string) {
        this.#fullName = parent ? parent.#fullName + '.' + name : name;

        if (parent) {
            this.#onLog = parent.#onLog;
        }

        const me = this;

        this.hSpam = (title?: string, data?: any) => {
            let td = this.timeDif;
            this.timeDif = undefined;

            me.#onLog.addEntry({
                level: LogLevel.SPAM,
                logger: me.#fullName, date: Date.now(), title, data, timeDif: td });
        };

        this.hInfo = (title?: string, data?: any) => {
            let td = this.timeDif;
            this.timeDif = undefined;

            me.#onLog.addEntry({
                level: LogLevel.INFO,
                logger: me.#fullName, date: Date.now(), title, data, timeDif: td });
        };

        this.hWarn = (title?: string, data?: any) => {
            let td = this.timeDif;
            this.timeDif = undefined;

            me.#onLog.addEntry({
                level: LogLevel.WARN,
                logger: me.#fullName, date: Date.now(), title, data, timeDif: td });
        };

        this.hError = (title?: string, data?: any) => {
            let td = this.timeDif;
            this.timeDif = undefined;

            me.#onLog.addEntry({
                level: LogLevel.ERROR,
                logger: me.#fullName, date: Date.now(), title, data, timeDif: td });
        };
    }

    setLogWriter(callback: LogWriter) {
        if (!callback) callback = gDefaultWriter;
        this.#onLog = callback;
    }

    spam(_l?: (w: LogLevelHandler)=>void): boolean {
        return false;
    }

    info(_l?: (w: LogLevelHandler)=>void): boolean {
        return false;
    }

    warn(_l?: (w: LogLevelHandler)=>void) {
        return false;
    }

    error(_l?: (w: LogLevelHandler)=>void) {
        return false;
    }

    beginSpam(l: (w: LogLevelHandler)=>void): VoidFunction {
        return gVoidFunction;
    }

    beginInfo(l: (w: LogLevelHandler)=>void): VoidFunction {
        return gVoidFunction;
    }

    protected doBegin(l: LogCall, w: LogLevelHandler): VoidFunction {
        const startTime = Date.now();

        return () => {
            this.timeDif = Date.now() - startTime;
            this.doCall(l, w);
        }
    }

    protected doCall(l: LogCall|undefined, w: LogLevelHandler) {
        if (l) {
            if (l instanceof Function) {
                l(w);
            }
            else {
                w(l as string);
            }
        }

        return true;
    }
}

export type VoidFunction = () => void;
const gVoidFunction = () => {};

//endregion

//region Log levels (extends JopiLogger)

export type LogLevelHandler = (title?: string, data?: any|undefined)=>void;

export function getLogLevelName(level: LogLevel) {
    switch (level) {
        case LogLevel.SPAM:
            return "SPAM";
        case LogLevel.ERROR:
            return "ERROR";
        case LogLevel.INFO:
            return "INFO";
        case LogLevel.WARN:
            return "WARN";
    }
}

export class LogSpamLevel extends JopiLogger {
    override spam(l?: LogCall) {
        return this.doCall(l, this.hSpam);
    }

    override info(l?: LogCall) {
        return this.doCall(l, this.hInfo);
    }

    override warn(l?: LogCall) {
        return this.doCall(l, this.hWarn);
    }

    override error(l?: LogCall) {
        return this.doCall(l, this.hError);
    }

    override beginSpam(l: LogCall) {
        return this.doBegin(l, this.hSpam);
    }

    override beginInfo(l: LogCall): VoidFunction {
        return this.doBegin(l, this.hInfo);
    }
}

export class LogInfoLevel extends JopiLogger {
    override info(l?: LogCall) {
        return this.doCall(l, this.hInfo);
    }

    override warn(l?: LogCall) {
        return this.doCall(l, this.hWarn);
    }

    override error(l?: LogCall) {
        return this.doCall(l, this.hError);
    }

    override beginInfo(l: LogCall): VoidFunction {
        return this.doBegin(l, this.hInfo);
    }
}

export class LogWarnLevel extends JopiLogger {
    override warn(l?: LogCall) {
        return this.doCall(l, this.hWarn);
    }

    override error(l?: LogCall) {
        return this.doCall(l, this.hError);
    }
}

export class LogErrorLevel extends JopiLogger {
    override error(l?: LogCall) {
        return this.doCall(l, this.hError);
    }
}

//endregion