let gCurrentLanguage = 'en';
const gTranslations: { [language: string]: { [key: string]: string } } = {};

export interface TranslationRequest {
    /**
     * The default value for the translation.
     */
    default?: string;

    /**
     * The parameters to use for values with parameters
     */
    params?: any;

    /**
     * If 'count' is more than one, then use plural form.
     */
    count?: number;
}

export function setLanguage(languageName: string): void {
    gCurrentLanguage = languageName;
}

export function translate(key: string, p: TranslationRequest): string {
    return translateTo(gCurrentLanguage, key, p);
}

export function translateTo(language: string, key: string, p: TranslationRequest): string {
    // Does it exist?
    if (!gTranslations[language]) {
        gTranslations[language] = {};
    }

    let translation: string | undefined;

    // Must use plural?
    //
    let translationKey = key;
    //
    if ((p.count !== undefined) && (p.count > 1)) {
        const pluralKey = `${key}_plural`;
        translation = gTranslations[language][pluralKey]
    }

    // Get the translation.
    if (!translation) {
        translation = gTranslations[language][translationKey];
    }

    // Not found?
    if (!translation) {
        if (p.default) {
            gTranslations[language][translationKey] = p.default;
            return p.default;
        }

        translation = `[trNotFound:${key}]`;
    }

    // Replace the parameters in the translation.
    if (p.params && translation.includes("$")) {
        for (const [paramKey, paramValue] of Object.entries(p.params)) {
            const placeholder = "$" + paramKey;
            translation = translation.replace(placeholder, String(paramValue));
        }
    }

    return translation;
}

export function addTranslation(language: string, key: string, value: string): void {
    if (!gTranslations[language]) {
        gTranslations[language] = {};
    }
    gTranslations[language][key] = value;
}

export function addTranslations(language: string, newTranslations: { [key: string]: string }): void {
    if (!gTranslations[language]) {
        gTranslations[language] = {};
    }

    Object.assign(gTranslations[language], newTranslations);
}
