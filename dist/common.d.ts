import type { Listener } from "./__global.ts";
export declare function execListeners(listeners: Listener[]): Promise<void>;
export declare function isServerSide(): boolean;
export declare function isBunJs(): boolean;
export declare function isNodeJs(): boolean;
