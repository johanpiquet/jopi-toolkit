import {getInstance} from "./instance.ts";
import { type TranslateImpl } from "./__global.ts";

const NodeSpace = getInstance();

let gCurrentLanguage = 'en';
const gTranslations: { [language: string]: { [key: string]: string } } = {};

const translateImpl: TranslateImpl = {
    setLanguage(languageName: string): void {
        gCurrentLanguage = languageName;
    },

    translate(key: string, params?: {[key: string]: string|number|boolean}, n?: number): string {
        return this.translateTo(gCurrentLanguage, key, params, n);
    },

    translateTo(language: string, key: string, params?: {[key: string]: string|number|boolean}, n?: number): string {
        // Does it exist?
        if (!gTranslations[language]) {
            gTranslations[language] = {};
        }

        // Must use plural?
        //
        let translationKey = key;
        let isPlural = false;
        //
        if (n !== undefined && n > 1) {
            isPlural = true;
            const pluralKey = `${key}_plural`;

            if (gTranslations[language][pluralKey]) {
                translationKey = pluralKey;
            }
        }

        // Get the translation.
        let translation = gTranslations[language][translationKey];

        // Not found?
        if (!translation) {
            if (isPlural) {
                return translateImpl.translateTo(language, key, params);
            }

            translation = `[trNotFound:${key}]`;
        }

        // Replace the parameters in the translation.
        if (params && translation.includes("$")) {
            for (const [paramKey, paramValue] of Object.entries(params)) {
                const placeholder = "$" + paramKey;
                translation = translation.replace(placeholder, String(paramValue));
            }
        }

        return translation;
    },

    addTranslation(language: string, key: string, value: string): void {
        if (!gTranslations[language]) {
            gTranslations[language] = {};
        }
        gTranslations[language][key] = value;
    },

    addTranslations(language: string, newTranslations: {[key: string]: string}): void {
        if (!gTranslations[language]) {
            gTranslations[language] = {};
        }

        Object.assign(gTranslations[language], newTranslations);
    }
};

export function init_nodeSpaceTranslate() {
    NodeSpace.translate = translateImpl;
}
