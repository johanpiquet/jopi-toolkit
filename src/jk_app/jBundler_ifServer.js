import { declareServerSideReady, declareAppExiting } from "./common.ts";
declareServerSideReady().then();
export function init() {
    // When the program exits gracefully
    process.on('exit', function () { return declareAppExiting(); });
    // When the user wants to terminate the program (CTRL+C)
    process.on('SIGINT', function () { return declareAppExiting(); });
}
