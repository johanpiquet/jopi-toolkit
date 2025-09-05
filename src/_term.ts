const T_RESET = "\x1b[0m";

const T_BOLD = "\x1b[1m";
const T_UNDERLINE = "\x1b[4m";

const T_CLEAR_LINE = "\x1b[2K";
const T_CLEAR_LINE_END = "\x1b[K";
const T_REWRITE_LINE = "\r\x1B[1F\x1B[1F\x1b[K";
const T_CLEAR_SCREEN = "\x1b[2J";
const T_LINE_START = "\r";

const C_RED = "\x1b[31m";
const C_BLUE = "\x1b[34m";
const C_LIGHT_BLUE = "\x1b[96m";
const C_GREEN = "\x1b[32m";
const C_GREY = "\x1b[90m";
const C_ORANGE = "\x1b[38;5;208m";

const B_BLACK = "\x1b[40m";
const B_RED = "\x1b[41m";
const B_GREEN = "\x1b[42m";
const B_YELLOW = "\x1b[43m";
const B_BLUE = "\x1b[44m";
const B_MAGENTA = "\x1b[45m";
const B_CYAN = "\x1b[46m";
const B_WHITE = "\x1b[47m";

function cssText(text: string, css: string) {
    console.log("%c" + text, css)
}

function moveUp(n: number) {
    return "\x1b[" + n + "A";
}

function moveDown(n: number) {
    return "\x1b[" + n + "B";
}

function moveLeft(n: number) {
    return "\x1b[" + n + "D";
}

function moveRight(n: number) {
    return "\x1b[" + n + "C";
}

function goAt(x: number, y: number) {
    return "\x1b[" + y + ";" + x + "H";
}

function buildWriter(...colors: any[]) {
    let before = colors.join("");
    return (...values: any[]) => before + values.join(" ") + T_RESET;
}

const buildLogger: (...colors: string[]) => ((...params: any[])=>void) = (...colors) => {
    const writer = buildWriter(...colors);
    return (...values) => console.log(writer(...values));
};

export function init_term() {
    NodeSpace.term = {
        cssText,

        moveUp, moveDown, moveLeft, moveRight, goAt,

        C_RED, C_GREEN, C_BLUE, C_LIGHT_BLUE, C_GREY, C_ORANGE,
        B_BLACK, B_BLUE, B_CYAN, B_GREEN, B_MAGENTA, B_RED, B_WHITE, B_YELLOW,
        T_RESET, T_BOLD, T_CLEAR_SCREEN, T_UNDERLINE, T_REWRITE_LINE, T_CLEAR_LINE, T_CLEAR_LINE_END, T_LINE_START,

        colorize(...params: string[]): string {
            return params.join("") + T_RESET;
        },

        consoleLogTemp: (isTemp: boolean, text: string) => {
            const terminalWidth = process.stdout.columns || 80;

            const maxPadding = Math.min(200, terminalWidth - 1);

            const truncatedText = text.length > maxPadding ? text.substring(0, maxPadding - 3) + '...' : text;
            const paddedText = truncatedText.padEnd(maxPadding);

            console.log(moveLeft(1000) + moveUp(1) + paddedText);
            if (!isTemp) console.log();
        },

        buildWriter: buildWriter,

        buildLogger,

        indentText(spacer, text) {
            return spacer + text.replaceAll("\r", "").replaceAll("\n", spacer + "\n");
        },

        logRed: buildLogger(C_RED),
        logBgRed: buildLogger(B_RED),

        logBlue: buildLogger(C_BLUE),
        logBgBlue: buildLogger(B_BLUE),

        logGreen: buildLogger(C_GREEN),
        logBgGreen: buildLogger(B_GREEN)
    }
}