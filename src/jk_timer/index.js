var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import * as jk_app from "jopi-toolkit/jk_app";
import * as jk_term from "jopi-toolkit/jk_term";
export var ONE_SECOND = 1000;
export var ONE_MINUTE = ONE_SECOND * 60;
export var ONE_HOUR = ONE_MINUTE * 60;
export var ONE_DAY = ONE_HOUR * 24;
var timerListeners = {};
export function newInterval(durationInMs, callback) {
    var _this = this;
    var entry = timerListeners[durationInMs];
    if (entry) {
        entry.push(callback);
        return;
    }
    timerListeners[durationInMs] = entry = [callback];
    var toCall = entry;
    var timerId = setInterval(function () { return __awaiter(_this, void 0, void 0, function () {
        var i, r;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < toCall.length)) return [3 /*break*/, 5];
                    r = toCall[i]();
                    if (!(r instanceof Promise)) return [3 /*break*/, 3];
                    return [4 /*yield*/, r];
                case 2:
                    r = _a.sent();
                    _a.label = 3;
                case 3:
                    // Returning false means the timer is not needed anymore.
                    if (r === false) {
                        toCall.splice(i, 1);
                        i--;
                    }
                    _a.label = 4;
                case 4:
                    i++;
                    return [3 /*break*/, 1];
                case 5:
                    if (!toCall.length) {
                        clearInterval(timerId);
                        delete (timerListeners[durationInMs]);
                    }
                    return [2 /*return*/];
            }
        });
    }); }, durationInMs);
    jk_app.onHotReload(function () {
        clearInterval(timerId);
        entry.splice(0);
    });
}
export function deferred(callback) {
    setTimeout(callback, 0);
}
export function tick(timeInMs) {
    return new Promise(function (resolve) { return setTimeout(resolve, timeInMs); });
}
export function chrono(mustSaveMeasures) {
    return new ChronoImpl(mustSaveMeasures);
}
function logAutoTrigger(m) {
    if (m.logIfMoreThan_ms && (m.elapsedTime_ms > m.logIfMoreThan_ms)) {
        if (m.title)
            jk_term.logRed("Chrono - " + m.title + ":", m.elapsedTime_sec);
        else
            console.log("Chrono - " + m.label + ":", m.elapsedTime_sec);
    }
}
var ChronoImpl = /** @class */ (function () {
    function ChronoImpl(mustSaveMeasures) {
        this.mustSaveMeasures = mustSaveMeasures;
        this.allMeasures = [];
        this.currentStart = 0;
        this.isStarted = false;
        this._onMeasureDone = null;
    }
    ChronoImpl.prototype.start_withLimit = function (limit, label, title) {
        this.start(label, title);
        this.currentLimit = limit;
    };
    ChronoImpl.prototype.start = function (label, title) {
        if (this.isStarted)
            this.end();
        this.isStarted = true;
        this.currentLabel = label;
        this.currentTitle = title;
        this.currentStart = Date.now();
        this.currentLimit = undefined;
    };
    ChronoImpl.prototype.end = function () {
        if (!this.isStarted)
            return;
        this.isStarted = false;
        var thisTime = Date.now();
        var measure = {
            title: this.currentTitle,
            label: this.currentLabel,
            logIfMoreThan_ms: this.currentLimit,
            startTime_ms: this.currentStart,
            endTime_ms: thisTime,
            elapsedTime_ms: thisTime - this.currentStart,
            elapsedTime_sec: ((thisTime - this.currentStart) / 1000).toFixed(3) + " sec"
        };
        this.lastMeasure = measure;
        if (this.mustSaveMeasures)
            this.allMeasures.push(measure);
        logAutoTrigger(measure);
        if (this._onMeasureDone)
            this._onMeasureDone(measure);
    };
    ChronoImpl.prototype.onMeasureDone = function (handler) {
        this._onMeasureDone = handler;
    };
    return ChronoImpl;
}());
