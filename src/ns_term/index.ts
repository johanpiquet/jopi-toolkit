// noinspection JSUnusedGlobalSymbols

export const T_RESET = "\x1b[0m";

export const T_BOLD = "\x1b[1m";
export const T_UNDERLINE = "\x1b[4m";

export const T_CLEAR_LINE = "\x1b[2K";
export const T_CLEAR_LINE_END = "\x1b[K";
export const T_REWRITE_LINE = "\r\x1B[1F\x1B[1F\x1b[K";
export const T_CLEAR_SCREEN = "\x1b[2J";
export const T_LINE_START = "\r";

export const C_RED = "\x1b[31m";
export const C_BLUE = "\x1b[34m";
export const C_LIGHT_BLUE = "\x1b[96m";
export const C_GREEN = "\x1b[32m";
export const C_GREY = "\x1b[90m";
export const C_ORANGE = "\x1b[38;5;208m";
export const C_WHITE = "\x1b[37m";

export const B_BLACK = "\x1b[40m";
export const B_RED = "\x1b[41m";
export const B_GREEN = "\x1b[42m";
export const B_YELLOW = "\x1b[43m";
export const B_BLUE = "\x1b[44m";
export const B_MAGENTA = "\x1b[45m";
export const B_CYAN = "\x1b[46m";
export const B_WHITE = "\x1b[47m";

export type TermLogger = (...args: any[]) => void;

export function cssText(text: string, css: string) {
    console.log("%c" + text, css)
}

export function moveUp(n: number) {
    return "\x1b[" + n + "A";
}

export function moveDown(n: number) {
    return "\x1b[" + n + "B";
}

export function moveLeft(n: number) {
    return "\x1b[" + n + "D";
}

export function moveRight(n: number) {
    return "\x1b[" + n + "C";
}

export function goAt(x: number, y: number) {
    return "\x1b[" + y + ";" + x + "H";
}

export function buildWriter(...colors: any[]) {
    let before = colors.join("");
    return (...values: any[]) => before + values.join(" ") + T_RESET;
}

export const buildLogger: (...colors: string[]) => ((...params: any[])=>void) = (...colors) => {
    const writer = buildWriter(...colors);
    return (...values) => console.log(writer(...values));
};

export function colorize(...params: string[]): string {
    return params.join("") + T_RESET;
}

export function consoleLogTemp(isTemp: boolean, text: string) {
    const terminalWidth = process.stdout.columns || 80;

    const maxPadding = Math.min(200, terminalWidth - 1);

    const truncatedText = text.length > maxPadding ? text.substring(0, maxPadding - 3) + '...' : text;
    const paddedText = truncatedText.padEnd(maxPadding);

    console.log(moveLeft(1000) + moveUp(1) + paddedText);
    if (!isTemp) console.log();
}

export function askYesNo(message: string, defaultValue: boolean): Promise<boolean> {
    return new Promise((resolve) => {
        const defaultText = defaultValue ? '[Y/n]' : '[y/N]';
        process.stdout.write(`${message} ${defaultText} `);

        process.stdin.once('data', (data) => {
            const input = data.toString().trim().toLowerCase();
            if (input === '') {
                resolve(defaultValue);
            } else {
                resolve(input === 'y');
            }
        });
    });
}

export const logRed = buildLogger(C_RED);
export const logBgRed = buildLogger(B_RED);

export const logBlue = buildLogger(C_BLUE);
export const logBgBlue = buildLogger(B_BLUE, C_WHITE);

export const logGreen = buildLogger(C_GREEN);
export const logBgGreen = buildLogger(B_GREEN, C_WHITE);

export function indentText(spacer: string, text: string): string {
    return spacer + text.replaceAll("\r", "").replaceAll("\n", spacer + "\n");
}

export function logSuccess(...args: any[]) {
    console.log(C_GREEN + "[SUCCESS] " + T_RESET, ...args);
}

export function logError(...args: any[]) {
    console.log(C_RED + "[ERROR] " + T_RESET, ...args);
}

export function logWarn(...args: any[]) {
    console.log(C_ORANGE + "[WARN] " + T_RESET, ...args);
}