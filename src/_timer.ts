import type {Chrono, ChronoMeasure, TimerCallback} from "./__global.ts";

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

    NodeSpace.app.onHotReload(() => {
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

export function init_nodeSpaceTimer() {
    NodeSpace.timer = {
        ONE_SECOND,
        ONE_MINUTE,
        ONE_HOUR,
        ONE_DAY,

        tick,
        newInterval,
        deferred,

        chrono: (mustSaveMeasures: boolean) => new ChronoImpl(mustSaveMeasures)
    };
}

class ChronoImpl implements Chrono {
    lastMeasure?: ChronoMeasure;
    allMeasures: ChronoMeasure[] = [];

    private currentStart: number = 0;
    private currentLabel: string|undefined;
    private isStarted = false;
    private _onMeasureDone: null | ((measure: ChronoMeasure) => void) = null;

    constructor(public mustSaveMeasures: boolean) {
    }

    start(label: string | undefined) {
        if (this.isStarted) this.end();
        this.currentLabel = label;
        this.currentStart = Date.now();
    }

    end() {
        const thisTime = Date.now();

        let measure: ChronoMeasure = {
            label: this.currentLabel,
            startTime_ms: this.currentStart,
            endTime_ms: thisTime,
            elapsedTime_ms: thisTime - this.currentStart,
            elapsedTime_sec: ((thisTime - this.currentStart) / 1000).toFixed(3)
        }

        this.lastMeasure = measure;
        if (this.mustSaveMeasures) this.allMeasures.push(measure);
        if (this._onMeasureDone) this._onMeasureDone(measure);
    }

    onMeasureDone(handler: null | ((measure: ChronoMeasure) => void)) {
        this._onMeasureDone = handler;
    }
}