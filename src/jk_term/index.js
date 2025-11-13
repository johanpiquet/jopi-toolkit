// noinspection JSUnusedGlobalSymbols
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
export var T_RESET = "\x1b[0m";
export var T_BOLD = "\x1b[1m";
export var T_UNDERLINE = "\x1b[4m";
export var T_CLEAR_LINE = "\x1b[2K";
export var T_CLEAR_LINE_END = "\x1b[K";
export var T_REWRITE_LINE = "\r\x1B[1F\x1B[1F\x1b[K";
export var T_CLEAR_SCREEN = "\x1b[2J";
export var T_LINE_START = "\r";
export var C_RED = "\x1b[31m";
export var C_BLUE = "\x1b[34m";
export var C_LIGHT_BLUE = "\x1b[96m";
export var C_GREEN = "\x1b[32m";
export var C_GREY = "\x1b[90m";
export var C_ORANGE = "\x1b[38;5;208m";
export var C_WHITE = "\x1b[37m";
export var B_BLACK = "\x1b[40m";
export var B_RED = "\x1b[41m";
export var B_GREEN = "\x1b[42m";
export var B_YELLOW = "\x1b[43m";
export var B_BLUE = "\x1b[44m";
export var B_MAGENTA = "\x1b[45m";
export var B_CYAN = "\x1b[46m";
export var B_WHITE = "\x1b[47m";
export function cssText(text, css) {
    console.log("%c" + text, css);
}
export function moveUp(n) {
    return "\x1b[" + n + "A";
}
export function moveDown(n) {
    return "\x1b[" + n + "B";
}
export function moveLeft(n) {
    return "\x1b[" + n + "D";
}
export function moveRight(n) {
    return "\x1b[" + n + "C";
}
export function goAt(x, y) {
    return "\x1b[" + y + ";" + x + "H";
}
export function buildWriter() {
    var colors = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        colors[_i] = arguments[_i];
    }
    var before = colors.join("");
    return function () {
        var values = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            values[_i] = arguments[_i];
        }
        return before + values.join(" ") + T_RESET;
    };
}
export var buildLogger = function () {
    var colors = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        colors[_i] = arguments[_i];
    }
    var writer = buildWriter.apply(void 0, colors);
    return function () {
        var values = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            values[_i] = arguments[_i];
        }
        return console.log(writer.apply(void 0, values));
    };
};
export function colorize() {
    var params = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        params[_i] = arguments[_i];
    }
    return params.join("") + T_RESET;
}
export function consoleLogTemp(isTemp, text) {
    var terminalWidth = process.stdout.columns || 80;
    var maxPadding = Math.min(200, terminalWidth - 1);
    var truncatedText = text.length > maxPadding ? text.substring(0, maxPadding - 3) + '...' : text;
    var paddedText = truncatedText.padEnd(maxPadding);
    console.log(moveLeft(1000) + moveUp(1) + paddedText);
    if (!isTemp)
        console.log();
}
export function askYesNo(message, defaultValue) {
    return new Promise(function (resolve) {
        var defaultText = defaultValue ? '[Y/n]' : '[y/N]';
        process.stdout.write("".concat(message, " ").concat(defaultText, " "));
        process.stdin.once('data', function (data) {
            var input = data.toString().trim().toLowerCase();
            if (input === '') {
                resolve(defaultValue);
            }
            else {
                resolve(input === 'y');
            }
        });
    });
}
export var logRed = buildLogger(C_RED);
export var textRed = buildWriter(C_RED);
export var logBgRed = buildLogger(B_RED);
export var textBgRed = buildWriter(B_RED);
export var logBlue = buildLogger(C_BLUE);
export var textBlue = buildWriter(C_BLUE);
export var logBgBlue = buildLogger(B_BLUE, C_WHITE);
export var textBgBlue = buildWriter(B_BLUE, C_WHITE);
export var logGreen = buildLogger(C_GREEN);
export var textGreen = buildWriter(C_GREEN);
export var logBgGreen = buildLogger(B_GREEN, C_WHITE);
export var textBgGreen = buildWriter(B_GREEN, C_WHITE);
export function indentText(spacer, text) {
    return spacer + text.replaceAll("\r", "").replaceAll("\n", spacer + "\n");
}
export function logSuccess() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    console.log.apply(console, __spreadArray([C_GREEN + "[SUCCESS] " + T_RESET], args, false));
}
export function logError() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    console.log.apply(console, __spreadArray([C_RED + "[ERROR] " + T_RESET], args, false));
}
export function logWarn() {
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    console.log.apply(console, __spreadArray([C_ORANGE + "[WARN] " + T_RESET], args, false));
}
