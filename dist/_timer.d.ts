import type { TimerCallback } from "./__global.ts";
export declare const ONE_SECOND = 1000;
export declare const ONE_MINUTE: number;
export declare const ONE_HOUR: number;
export declare const ONE_DAY: number;
export declare function newInterval(durationInMs: number, callback: TimerCallback): void;
export declare function deferred(callback: () => void): void;
export declare function tick(timeInMs: number): Promise<void>;
export declare function init_nodeSpaceTimer(): void;
