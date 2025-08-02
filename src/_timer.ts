export const ONE_SECOND = 1000;
export const ONE_MINUTE = ONE_SECOND * 60;
export const ONE_HOUR = ONE_MINUTE * 60;
export const ONE_DAY = ONE_HOUR * 24;

const onHotReload = NodeSpace.app.onHotReload;

export type TimerCallback = () => void|boolean|Promise<void|boolean>;

const timerListeners: {[timerDuration: number]: TimerCallback[]} = {};

export function newInterval(durationInMs: number, callback: TimerCallback) {
    let entry = timerListeners[durationInMs];

    if (entry) {
        entry.push(callback);
        return;
    }

    timerListeners[durationInMs] = entry = [callback];

    const toCall = entry;

    const timerId = setInterval(async () => {
        for (let i=0; i<toCall.length; i++) {
            let r = toCall[i]();
            if (r instanceof Promise) r = await r;

            // Returning false means the timer is not needed anymore.
            if (r===false) {
                toCall.splice(i, 1);
                i--;
            }
        }

        if (!toCall.length) {
            clearInterval(timerId);
            delete(timerListeners[durationInMs]);
        }

    }, durationInMs);

    onHotReload(() => {
        clearInterval(timerId);
        entry.splice(0);
    });
}

export function deferred(callback: ()=>void) {
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
        deferred
    };
}