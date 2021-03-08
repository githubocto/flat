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
exports.determineFilename = void 0;
const core = __importStar(require("@actions/core"));
const fs_1 = __importDefault(require("fs"));
const axios_1 = __importDefault(require("axios"));
const content_disposition_1 = require("@tinyhttp/content-disposition");
const path_1 = require("path");
const es_mime_types_1 = require("es-mime-types");
function fetchHTTP(config) {
    return __awaiter(this, void 0, void 0, function* () {
        core.info('Fetching: HTTP');
        try {
            const response = yield axios_1.default.get(config.http_url, {
                method: 'get',
                responseType: 'stream',
            });
            const filename = determineFilename(response, config);
            yield response.data.pipe(fs_1.default.createWriteStream(filename));
        }
        catch (error) {
            core.setFailed(error);
            throw error;
        }
    });
}
exports.default = fetchHTTP;
function determineFilename(response, config) {
    // if there's a content-disposition header, use that
    const contentDisposition = response.headers['content-disposition'];
    if (contentDisposition) {
        const cd = content_disposition_1.parse(contentDisposition);
        if (cd) {
            return path_1.basename(cd.parameters.filename);
        }
    }
    // otherwise, try to use content-type
    const contentType = response.headers['content-type'];
    if (contentType && es_mime_types_1.extension(contentType)) {
        return `${config.outfile_basename}.${es_mime_types_1.extension(contentType)}`;
    }
    // Failing that, use the base output filename
    core.warning(`Unable to determine an appropriate filename from content-disposition or content-type headers. Saving data to "${config.outfile_basename}" with no extension.`);
    return config.outfile_basename;
}
exports.determineFilename = determineFilename;
