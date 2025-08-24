export const ONE_SECOND = 1000;
export const ONE_MINUTE = ONE_SECOND * 60;
export const ONE_HOUR = ONE_MINUTE * 60;
export const ONE_DAY = ONE_HOUR * 24;
const timerListeners = {};
export function newInterval(durationInMs, callback) {
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
            if (r instanceof Promise)
                r = await r;
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
export function deferred(callback) {
    setTimeout(callback, 0);
}
export function tick(timeInMs) {
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
        chrono: (mustSaveMeasures) => new ChronoImpl(mustSaveMeasures)
    };
}
class ChronoImpl {
    constructor(mustSaveMeasures) {
        this.mustSaveMeasures = mustSaveMeasures;
        this.allMeasures = [];
        this.currentStart = 0;
        this.isStarted = false;
        this._onMeasureDone = null;
    }
    start(label) {
        if (this.isStarted)
            this.end();
        this.currentLabel = label;
        this.currentStart = Date.now();
    }
    end() {
        const thisTime = Date.now();
        let measure = {
            label: this.currentLabel,
            startTime_ms: this.currentStart,
            endTime_ms: thisTime,
            elapsedTime_ms: thisTime - this.currentStart,
            elapsedTime_sec: ((thisTime - this.currentStart) / 1000).toFixed(3)
        };
        this.lastMeasure = measure;
        if (this.mustSaveMeasures)
            this.allMeasures.push(measure);
        if (this._onMeasureDone)
            this._onMeasureDone(measure);
    }
    onMeasureDone(handler) {
        this._onMeasureDone = handler;
    }
}
//# sourceMappingURL=_timer.js.map