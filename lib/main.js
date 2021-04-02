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
const child_process_1 = require("child_process");
const path_1 = require("path");
const http_1 = __importDefault(require("./backends/http"));
const sql_1 = __importDefault(require("./backends/sql"));
const config_1 = require("./config");
const git_1 = require("./git");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        core.info('[INFO] Usage https://github.com/githubocto/flat#readme');
        core.startGroup('Configuration');
        const config = config_1.getConfig();
        const username = 'flat-data';
        yield exec_1.exec('git', ['config', 'user.name', username]);
        yield exec_1.exec('git', [
            'config',
            'user.email',
            `${username}@users.noreply.github.com`,
        ]);
        core.endGroup();
        core.startGroup('Fetch data');
        let filename = '';
        let source;
        if (config_1.isHTTPConfig(config)) {
            filename = yield http_1.default(config);
            source = config.http_url;
        }
        else if (config_1.isSQLConfig(config)) {
            filename = yield sql_1.default(config);
        }
        else {
            // typescript should preclude us from ever being here
            // because config is HTTPConfig | SQLConfig
            // But to be on the safe side, blow up if execution
            // has reached this point.
            core.setFailed('Unable to read a coherent action configuration');
        }
        core.endGroup();
        core.debug(`*** postprocess is: ${config.postprocess}`);
        core.debug('*** pwd');
        core.debug(child_process_1.execSync('pwd').toString());
        // core.debug('*** ls')
        // core.debug(execSync('ls').toString())
        // core.debug(
        //   '*** ls ~/work/_actions/githubocto/flat/postprocessing/postprocess'
        // )
        // core.debug(
        //   execSync(
        //     'ls ~/work/_actions/githubocto/flat/postprocessing/postprocess'
        //   ).toString()
        // )
        core.debug(`*** __dirname: ${__dirname}`);
        core.debug(`*** __dirname/../postprocess/shim.ts: ${path_1.join(__dirname, '../postprocess/shim.ts')}`);
        core.debug(`*** GITHUB_ACTION: ${process.env['GITHUB_ACTION']}`);
        if (config.postprocess) {
            core.startGroup('Postprocess');
            try {
                // TODO: where is the shim at runtime?
                // ~/work/_actions/githubocto/flat/postprocessing/
                // /home/runner/work/_actions/githubocto/flat/postprocessing/
                // TODO: `Postprocessing` needs to be a branch identifier, how do we get this at runtime?
                filename = child_process_1.execSync(`deno run -A ${path_1.join(__dirname, '../postprocess/shim.ts')} ${config.postprocess} ${filename}`).toString();
            }
            catch (error) {
                core.setFailed(error);
            }
            core.endGroup();
        }
        core.startGroup('Calculating diffstat');
        yield exec_1.exec('git', ['add', '-A']); // TODO: should be filename instead of -A, but it fails otherwise
        const bytes = yield git_1.diff();
        core.setOutput('delta_bytes', bytes);
        core.endGroup();
        if (bytes === 0) {
            return;
        }
        core.startGroup('Committing new data');
        const sign = bytes >= 0 ? '+' : '';
        const date = new Date().toISOString();
        const msg = `Latest data: ${date} (${sign}${bytes}b)`;
        const meta = JSON.stringify({
            files: [{ name: filename, deltaBytes: bytes, date, source }],
        }, undefined, 2);
        core.info(`Committing "${msg}"`);
        core.debug(meta);
        yield exec_1.exec('git', ['commit', '-m', msg + '\n' + meta]);
        yield exec_1.exec('git', ['push']);
        core.endGroup();
    });
}
run().catch(error => {
    core.setFailed('Workflow failed! ' + error.message);
});
