import * as jk_app from "jopi-toolkit/jk_app";
import * as jk_fs from "jopi-toolkit/jk_fs";
import type {LogInitializer} from "./index.ts";

export function init(init: LogInitializer) {
    const mainDir = jk_app.findPackageJsonDir();
    const filePath = jk_fs.join(mainDir, "logConfig.json");

    if (!jk_fs.isFile(filePath)) return;
    let text = jk_fs.readTextFromFileSync(jk_fs.join(mainDir, "logConfig.json"));

    if (!text) return;
    let logJson = JSON.parse(text)
    if (!logJson.config) return;

    for (let logName in logJson.config) {
        let logConfig = logJson.config[logName];

        if (typeof(logConfig)==="string") {
            logConfig = {level: logConfig.toUpperCase().trim()};
        } else if (!logConfig) {
            logConfig = {level: "none" };
        }

        init.setLogLevel(logName, logConfig);
    }
}