import * as ns_app from "jopi-toolkit/ns_app";
import * as ns_term from "jopi-toolkit/ns_term";

export type TimerCallback = () => void|boolean|Promise<void|boolean>;

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

export const ONE_SECOND = 1000;
export const ONE_MINUTE = ONE_SECOND * 60;
export const ONE_HOUR = ONE_MINUTE * 60;
export const ONE_DAY = ONE_HOUR * 24;

const timerListeners: { [timerDuration: number]: TimerCallback[] } = {};

export function newInterval(durationInMs: number, callback: TimerCallback) {
    let entry = timerListeners[durationInMs];

    if (entry) {
        entry.push(callback);
        return;
    }

    timerListeners[durationInMs] = entry = [callback];

    const toCall = entry;

    const timerId = setInterval(async () => {
        for (let i = 0; i < toCall.length; i++) {
            let r = toCall[i]();
            if (r instanceof Promise) r = await r;

            // Returning false means the timer is not needed anymore.
            if (r === false) {
                toCall.splice(i, 1);
                i--;
            }
        }

        if (!toCall.length) {
            clearInterval(timerId);
            delete (timerListeners[durationInMs]);
        }

    }, durationInMs);

    ns_app.onHotReload(() => {
        clearInterval(timerId);
        entry.splice(0);
    });
}

export function deferred(callback: () => void) {
    setTimeout(callback, 0);
}

export function tick(timeInMs: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, timeInMs));
}

export function chrono(mustSaveMeasures: boolean): Chrono {
    return new ChronoImpl(mustSaveMeasures)
}

function logAutoTrigger(m: ChronoMeasure) {
    if (m.logIfMoreThan_ms && (m.elapsedTime_ms > m.logIfMoreThan_ms)) {
        if (m.title) ns_term.logRed("Chrono - " + m.title + ":", m.elapsedTime_sec);
        else console.log("Chrono - " + m.label + ":", m.elapsedTime_sec);
    }
}

class ChronoImpl implements Chrono {
    lastMeasure?: ChronoMeasure;
    allMeasures: ChronoMeasure[] = [];

    private currentStart: number = 0;
    private currentLabel: string|undefined;
    private currentTitle: string|undefined;
    private currentLimit: number|undefined;

    private isStarted = false;
    private _onMeasureDone: null | ((measure: ChronoMeasure) => void) = null;

    constructor(public mustSaveMeasures: boolean) {
    }

    start_withLimit(limit: number, label: string, title?: string) {
        this.start(label, title);
        this.currentLimit = limit;
    }

    start(label: string, title?: string) {
        if (this.isStarted) this.end();
        this.isStarted = true;

        this.currentLabel = label;
        this.currentTitle = title;
        this.currentStart = Date.now();
        this.currentLimit = undefined;
    }

    end() {
        if (!this.isStarted) return;
        this.isStarted = false;

        const thisTime = Date.now();

        let measure: ChronoMeasure = {
            title: this.currentTitle,
            label: this.currentLabel,

            logIfMoreThan_ms: this.currentLimit,

            startTime_ms: this.currentStart,
            endTime_ms: thisTime,
            elapsedTime_ms: thisTime - this.currentStart,
            elapsedTime_sec: ((thisTime - this.currentStart) / 1000).toFixed(3) + " sec"
        }

        this.lastMeasure = measure;
        if (this.mustSaveMeasures) this.allMeasures.push(measure);

        logAutoTrigger(measure);
        if (this._onMeasureDone) this._onMeasureDone(measure);
    }

    onMeasureDone(handler: null | ((measure: ChronoMeasure) => void)) {
        this._onMeasureDone = handler;
    }
}