"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.diff = exports.gitStatus = void 0;
const exec_1 = require("@actions/exec");
const fs_1 = require("fs");
const core = __importStar(require("@actions/core"));
function withListenerOpts(s) {
    return {
        listeners: {
            stdout: (data) => {
                s += data.toString();
            }
        }
    };
}
function gitStatus() {
    return __awaiter(this, void 0, void 0, function* () {
        core.debug('Getting gitStatus()');
        let output = '';
        yield exec_1.exec('git', ['status', '-s'], {
            listeners: {
                stdout: (data) => {
                    output += data.toString();
                }
            }
        });
        core.debug(`=== output was:\n${output}`);
        return output.split('\n').filter(l => l != '').map(l => {
            const chunks = l.trim().split(/\s+/);
            return {
                flag: chunks[0],
                path: chunks[1]
            };
        });
    });
}
exports.gitStatus = gitStatus;
function getHeadSize(path) {
    return __awaiter(this, void 0, void 0, function* () {
        let raw = '';
        const exitcode = yield exec_1.exec('git', ['cat-file', '-s', `HEAD:${path}`], withListenerOpts(raw));
        if (exitcode === 0) {
            return parseInt(raw, 10);
        }
    });
}
function diffSize(file) {
    return __awaiter(this, void 0, void 0, function* () {
        const stat = fs_1.statSync(file.path);
        switch (file.flag) {
            case 'M':
                // get old size and compare
                const oldSize = yield getHeadSize(file.path);
                core.debug(`oldsize: ${oldSize}`);
                return oldSize === undefined ? stat.size : stat.size - oldSize;
            case 'A':
                return stat.size;
            default:
                throw new Error(`Encountered an unexpected file status in git: ${file.flag} ${file.path}`);
        }
    });
}
function diff() {
    return __awaiter(this, void 0, void 0, function* () {
        const statuses = yield gitStatus();
        core.debug(`Parsed statuses: ${statuses.map(s => JSON.stringify(s)).join(', ')}`);
        statuses.forEach(s => core.debug(`${s.flag} ${s.path}`));
        const sizes = yield Promise.all(statuses.map(diffSize));
        return sizes.reduce((acc, cur) => acc + cur);
    });
}
exports.diff = diff;
