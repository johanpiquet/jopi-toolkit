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
import { PriorityLevel as EventPriority } from "jopi-toolkit/jk_tools";
// Warning: it's export.
export { PriorityLevel as EventPriority } from "jopi-toolkit/jk_tools";
var EventGroup = /** @class */ (function () {
    function EventGroup() {
        this.listenersFor = {};
        this.providers = {};
    }
    EventGroup.prototype.newEventGroup = function () {
        return new EventGroup();
    };
    EventGroup.prototype.enableEventSpying = function (spy) {
        this.evenSpy = spy;
    };
    EventGroup.prototype.removeListener = function (eventName, listener) {
        var events = this.listenersFor[eventName];
        if (events)
            events.remove(listener);
    };
    EventGroup.prototype.sendEvent = function (eventName, e) {
        if (this.evenSpy)
            this.evenSpy(eventName, e);
        var events = this.listenersFor[eventName];
        if (!events)
            return;
        if (events.value) {
            var values = events.value;
            for (var _i = 0, values_1 = values; _i < values_1.length; _i++) {
                var listener = values_1[_i];
                listener(e, eventName);
            }
        }
    };
    EventGroup.prototype.sendAsyncEvent = function (eventName, e) {
        return __awaiter(this, void 0, void 0, function () {
            var events, provider, listeners, _i, listeners_1, listener, values, _a, values_2, listener, r;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (this.evenSpy)
                            this.evenSpy(eventName, e);
                        events = this.listenersFor[eventName];
                        if (!!events) return [3 /*break*/, 3];
                        provider = this.providers[eventName];
                        events = new PriorityArray();
                        if (!provider) return [3 /*break*/, 2];
                        return [4 /*yield*/, provider()];
                    case 1:
                        listeners = _b.sent();
                        for (_i = 0, listeners_1 = listeners; _i < listeners_1.length; _i++) {
                            listener = listeners_1[_i];
                            events.add(EventPriority.default, listener);
                        }
                        _b.label = 2;
                    case 2:
                        this.listenersFor[eventName] = events;
                        _b.label = 3;
                    case 3:
                        if (!events.value) return [3 /*break*/, 7];
                        values = events.value;
                        _a = 0, values_2 = values;
                        _b.label = 4;
                    case 4:
                        if (!(_a < values_2.length)) return [3 /*break*/, 7];
                        listener = values_2[_a];
                        r = listener(e, eventName);
                        if (!(r instanceof Promise)) return [3 /*break*/, 6];
                        return [4 /*yield*/, r];
                    case 5:
                        _b.sent();
                        _b.label = 6;
                    case 6:
                        _a++;
                        return [3 /*break*/, 4];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    EventGroup.prototype.addListener = function (eventName, priorityOrListener, listener) {
        var priority;
        var actualListener;
        if (typeof priorityOrListener === 'function') {
            // Cas où priority n'est pas fournie, priorityOrListener est le listener
            priority = EventPriority.default;
            actualListener = priorityOrListener;
        }
        else {
            // Cas où priority est fournie
            priority = priorityOrListener;
            actualListener = listener;
        }
        var events = this.listenersFor[eventName];
        if (!events)
            this.listenersFor[eventName] = events = new PriorityArray();
        events.add(priority, actualListener);
    };
    /**
     * For async events, allow loading some elements (import)
     * only when the event is emitted for the time.
     */
    EventGroup.prototype.addProvider = function (eventName, provider) {
        this.providers[eventName] = provider;
    };
    return EventGroup;
}());
export { EventGroup };
//region PriorityArray
/**
 * Allows building an array which entries are sorted by priority.
 */
var PriorityArray = /** @class */ (function () {
    function PriorityArray() {
        this.entries = [];
    }
    PriorityArray.prototype.add = function (priority, value) {
        this.build = undefined;
        this.entries.push({ priority: priority, value: value });
    };
    PriorityArray.prototype.remove = function (value) {
        this.build = undefined;
        this.entries = this.entries.filter(function (e) { return e.value !== value; });
    };
    Object.defineProperty(PriorityArray.prototype, "value", {
        get: function () {
            if (this.build) {
                return this.build;
            }
            return this.build = this.entries
                .sort(function (a, b) { return Number(a.priority) - Number(b.priority); })
                .map(function (e) { return e.value; });
        },
        enumerable: false,
        configurable: true
    });
    return PriorityArray;
}());
//endregion
var StaticEvent = /** @class */ (function () {
    function StaticEvent(eventName, eventItems) {
        this.eventName = eventName;
        this.eventItems = eventItems;
    }
    StaticEvent.prototype.send = function (data) {
        for (var _i = 0, _a = this.eventItems; _i < _a.length; _i++) {
            var listener = _a[_i];
            listener(data, this.eventName);
        }
        return data;
    };
    return StaticEvent;
}());
export { StaticEvent };
export function createStaticEvent(eventName, eventItems) {
    return new StaticEvent(eventName, eventItems);
}
export var defaultEventGroup = new EventGroup();
export function newEventGroup() {
    return new EventGroup();
}
export var enableEventSpying = defaultEventGroup.enableEventSpying.bind(defaultEventGroup);
export var removeListener = defaultEventGroup.removeListener.bind(defaultEventGroup);
export var sendEvent = defaultEventGroup.sendEvent.bind(defaultEventGroup);
export var sendAsyncEvent = defaultEventGroup.sendAsyncEvent.bind(defaultEventGroup);
export function addListener(eventName, priorityOrListener, listener) {
    defaultEventGroup.addListener(eventName, priorityOrListener, listener);
}
