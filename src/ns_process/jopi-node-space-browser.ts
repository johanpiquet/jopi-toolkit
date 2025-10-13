function initEnv(): Record<string, string> {
    try {
        return import.meta.env as Record<string, string>;
    } catch {
        return {};
    }
}

function initIsProduction() {
    try {
        return import.meta.env.PROD === "true";
    } catch {
        return false;
    }
}

export const argv: string[] = [];
export const env: Record<string, string> = initEnv();
export const isProduction: boolean = initIsProduction();