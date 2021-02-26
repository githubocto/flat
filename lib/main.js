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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const exec_1 = require("@actions/exec");
const http_1 = __importDefault(require("./backends/http"));
const sql_1 = __importDefault(require("./backends/sql"));
const config_1 = require("./config");
const git_1 = require("./git");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        core.info('[INFO] Usage https://github.com/githubocto/flat#readme');
        core.startGroup('Configuration');
        const config = config_1.getConfig();
        const username = process.env.GITHUB_ACTOR;
        yield exec_1.exec('git', ['config', 'user.name', username]);
        yield exec_1.exec('git', ['config', 'user.email', `${username}@users.noreply.github.com`]);
        core.endGroup();
        core.startGroup('Fetch data');
        if (config_1.isHTTPConfig(config)) {
            yield http_1.default(config);
        }
        else if (config_1.isSQLConfig(config)) {
            yield sql_1.default(config);
        }
        core.endGroup();
        core.startGroup('Calculating diffstat');
        yield exec_1.exec('git', ['add', '-A']);
        const bytes = yield git_1.diff();
        core.setOutput('deltabytes', bytes);
        core.endGroup();
        if (bytes === 0) {
            return;
        }
        core.startGroup('Committing new data');
        const msg = `Latest data: ${new Date().toISOString()} (${bytes > 0 && '+'}${bytes}b)`;
        core.info(`Committing "${msg}"`);
        yield exec_1.exec('git', ['commit', '-m', msg]);
        core.endGroup();
    });
}
run()
    .catch(error => {
    core.setFailed("Workflow failed! " + error.message);
});
