var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
export function generateUUIDv4() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0;
        var v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
export function isUUIDv4(text) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text);
}
export function getErrorMessage(e) {
    if (e instanceof Error)
        return e.message;
    return "" + e;
}
export function applyDefaults(source, defaults) {
    if (!source)
        source = {};
    return __assign(__assign({}, defaults), source);
}
/**
 * Allow knowing the file path of the function calling us.
 */
export function getCallerFilePath() {
    try {
        throw new Error("");
    }
    catch (e) {
        var error = e;
        if (!error.stack)
            return undefined;
        var stackLines = error.stack.split('\n');
        if (stackLines.length < 4)
            return undefined;
        // Here we have something like:
        // at file:///Users/johan/Projets/jopi-rewrite-workspace/__tests/jopi-ui-sample/dist/mod_sample/routes/tests/test3.page.js:4:1
        //
        var fileUrl = stackLines[3].trim();
        var idx = fileUrl.indexOf("file://");
        fileUrl = fileUrl.substring(idx);
        idx = fileUrl.lastIndexOf(":");
        fileUrl = fileUrl.substring(0, idx);
        idx = fileUrl.lastIndexOf(":");
        if (idx !== -1)
            fileUrl = fileUrl.substring(0, idx);
        return fileUrl;
    }
}
export var PriorityLevel;
(function (PriorityLevel) {
    PriorityLevel[PriorityLevel["veryLow"] = -200] = "veryLow";
    PriorityLevel[PriorityLevel["low"] = -100] = "low";
    PriorityLevel[PriorityLevel["default"] = 0] = "default";
    PriorityLevel[PriorityLevel["high"] = 100] = "high";
    PriorityLevel[PriorityLevel["veryHigh"] = 200] = "veryHigh";
})(PriorityLevel || (PriorityLevel = {}));
export function sortByPriority(values) {
    if (values === undefined)
        return undefined;
    values.sort(function (a, b) {
        if (a.priority < b.priority)
            return -1;
        if (a.priority > b.priority)
            return 1;
        return 0;
    });
    return values.map(function (v) { return v.value; });
}
