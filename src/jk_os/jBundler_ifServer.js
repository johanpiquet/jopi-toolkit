"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.whichSync = whichSync;
exports.exec = exec;
var node_child_process_1 = require("node:child_process");
var node_process_1 = require("node:process");
var path = require("node:path");
var fs = require("node:fs/promises");
var node_fs_1 = require("node:fs");
function which(command, ifNotFound) {
    return __awaiter(this, void 0, void 0, function () {
        var pathArray, extensions, _i, pathArray_1, dir, _a, extensions_1, ext, fullPath, stats, _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    pathArray = (node_process_1.env.PATH || '').split(process.platform === 'win32' ? ';' : ':');
                    extensions = process.platform === 'win32' ? ['.exe', '.cmd', '.bat'] : [''];
                    _i = 0, pathArray_1 = pathArray;
                    _c.label = 1;
                case 1:
                    if (!(_i < pathArray_1.length)) return [3 /*break*/, 8];
                    dir = pathArray_1[_i];
                    _a = 0, extensions_1 = extensions;
                    _c.label = 2;
                case 2:
                    if (!(_a < extensions_1.length)) return [3 /*break*/, 7];
                    ext = extensions_1[_a];
                    fullPath = path.join(dir, command + ext);
                    _c.label = 3;
                case 3:
                    _c.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, fs.stat(fullPath)];
                case 4:
                    stats = _c.sent();
                    if (stats.isFile())
                        return [2 /*return*/, fullPath];
                    return [3 /*break*/, 6];
                case 5:
                    _b = _c.sent();
                    return [3 /*break*/, 6];
                case 6:
                    _a++;
                    return [3 /*break*/, 2];
                case 7:
                    _i++;
                    return [3 /*break*/, 1];
                case 8:
                    if (ifNotFound)
                        return [2 /*return*/, ifNotFound];
                    return [2 /*return*/, null];
            }
        });
    });
}
function whichSync(cmd, ifNotFound) {
    var paths = (process.env.PATH || '').split(path.delimiter);
    if (process.platform === 'win32') {
        var extToTest = process.env.PATHEXT ? process.env.PATHEXT.split(';') : ['.EXE', '.CMD', '.BAT'];
        for (var _i = 0, paths_1 = paths; _i < paths_1.length; _i++) {
            var p = paths_1[_i];
            for (var _a = 0, extToTest_1 = extToTest; _a < extToTest_1.length; _a++) {
                var ext = extToTest_1[_a];
                var full = path.join(p, cmd + ext.toLowerCase());
                if (node_fs_1.default.existsSync(full))
                    return full;
                var fullUpper = path.join(p, cmd + ext);
                if (node_fs_1.default.existsSync(fullUpper))
                    return fullUpper;
            }
        }
    }
    else {
        for (var _b = 0, paths_2 = paths; _b < paths_2.length; _b++) {
            var p = paths_2[_b];
            var full = path.join(p, cmd);
            if (node_fs_1.default.existsSync(full))
                return full;
            var fullUpper = path.join(p, cmd);
            if (node_fs_1.default.existsSync(fullUpper))
                return fullUpper;
        }
    }
    if (ifNotFound)
        return ifNotFound;
    return null;
}
function exec(command) {
    return new Promise(function (resolve, reject) {
        (0, node_child_process_1.exec)(command, function (error) {
            if (error)
                reject(error);
            else
                resolve();
        });
    });
}
