import * as jk_fs from "jopi-toolkit/jk_fs";
import {addArobaseType, applyTypeRulesOnDir, addReplace} from "./engine.ts";

addArobaseType("replaces", {
    position: "root",

    async processDir(p) {
        let itemTypes = await jk_fs.listDir(p.arobaseDir);

        for (let itemType of itemTypes) {
            if ((itemType.name[0]==='_') || (itemType.name[0]==='.')) continue;

            await applyTypeRulesOnDir({
                dirToScan: itemType.fullPath,
                expectFsType: "dir",

                itemDefRules: {
                    nameConstraint: "mustBeUid",
                    requireRefFile: true,

                    rootDirName: itemType.name,

                    transform: async (props) => {
                        const itemToReplace = props.itemName;
                        const mustReplaceWith = props.refTarget!;
                        addReplace(itemToReplace, mustReplaceWith, props.priority, props.itemPath);
                    }
                }
            });
        }
    },

    async generateCodeForItem(e) {}
});