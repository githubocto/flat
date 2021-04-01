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
    outfile_basename: z.string(),
    postprocess: z.string().optional(),
});
const HTTPConfigSchema = z
    .object({
    http_url: z.string(),
})
    .merge(CommonConfigSchema);
const SQLConfigSchema = z
    .object({
    sql_connstring: z.string(),
    sql_queryfile: z.string(),
    sql_format: FormatEnum,
})
    .merge(CommonConfigSchema);
const ConfigSchema = z.union([HTTPConfigSchema, SQLConfigSchema]);
function getConfig() {
    const raw = {};
    const keys = [
        'outfile_basename',
        'http_url',
        'sql_format',
        'sql_connstring',
        'sql_queryfile',
        'postprocess',
    ];
    keys.forEach(k => {
        const v = core.getInput(k);
        if (v) {
            raw[k] = v;
        }
    });
    core.debug(`Raw config: ${JSON.stringify(raw)}`);
    try {
        if ('http_url' in raw) {
            return HTTPConfigSchema.parse(raw);
        }
        else if ('sql_connstring' in raw) {
            return SQLConfigSchema.parse(raw);
        }
        else {
            throw new Error('One of `http_url` or `sql_connstring` inputs are required.');
        }
    }
    catch (error) {
        throw new Error(`Invalid configuration!\nReceived: ${JSON.stringify(raw)}\nFailure:${error.message}`);
    }
}
exports.getConfig = getConfig;
function isHTTPConfig(config) {
    return 'http_url' in config;
}
exports.isHTTPConfig = isHTTPConfig;
function isSQLConfig(config) {
    return 'sql_connstring' in config && 'sql_queryfile' in config;
}
exports.isSQLConfig = isSQLConfig;
