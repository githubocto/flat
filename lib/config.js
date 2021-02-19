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
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSQLConfig = exports.isHTTPConfig = exports.getConfig = void 0;
const core = __importStar(require("@actions/core"));
const z = __importStar(require("zod"));
const FormatEnum = z.enum(['csv', 'json']);
const CommonConfigSchema = z.object({
    outfile: z.string(),
    format: FormatEnum
}).strict();
const HTTPConfigSchema = z.object({
    url: z.string()
}).merge(CommonConfigSchema).strict();
const SQLConfigSchema = z.object({
    connstring: z.string(),
    queryfile: z.string(),
}).merge(CommonConfigSchema).strict();
const ConfigSchema = z.union([HTTPConfigSchema, SQLConfigSchema]);
function getConfig() {
    const raw = {};
    const keys = ['outfile', 'format', 'url', 'connstring', 'queryfile'];
    keys.forEach(k => {
        const v = core.getInput(k);
        if (v) {
            raw[k] = v;
        }
    });
    core.debug(`Raw config: ${JSON.stringify(raw)}`);
    return validate(raw);
}
exports.getConfig = getConfig;
function validate(raw) {
    return ConfigSchema.parse(raw);
}
function isHTTPConfig(config) {
    return ('url' in config);
}
exports.isHTTPConfig = isHTTPConfig;
function isSQLConfig(config) {
    return ('connstring' in config && 'queryfile' in config);
}
exports.isSQLConfig = isSQLConfig;
