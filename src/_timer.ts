import {tick} from "./common.ts";

export function init_nodeSpaceTimer() {
    NodeSpace.timer = {
        tick: tick
    };
}