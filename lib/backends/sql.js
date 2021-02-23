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
const core = __importStar(require("@actions/core"));
const connection_string_1 = require("connection-string");
const fs_1 = require("fs");
const promises_1 = require("fs/promises");
const typeorm_1 = require("typeorm");
// TODO: wish there was a dynamic way to import this for runtime usage from the DatabaseType type
const TYPEORM_PROTOCOLS = ["mysql", "postgres", "cockroachdb", "sap", "mariadb", "sqlite", "cordova", "react-native", "nativescript", "sqljs", "oracle", "mssql", "mongodb", "aurora-data-api", "aurora-data-api-pg", "expo", "better-sqlite3"];
function isValidDatabaseType(protocol) {
    return TYPEORM_PROTOCOLS.includes(protocol);
}
function fetchSQL(config) {
    return __awaiter(this, void 0, void 0, function* () {
        let connection;
        const query = yield promises_1.readFile(config.queryfile, { encoding: 'utf8' })
            .catch(err => {
            core.setFailed(err);
            throw err;
        });
        const parsed = new connection_string_1.ConnectionString(config.connstring);
        try {
            const protocol = parsed.protocol;
            if (!protocol) {
                throw new Error('Unable to determine the database protocol from the connection string');
            }
            if (!isValidDatabaseType(protocol)) {
                throw new Error(`The '${protocol}' protocol is not supported. Please choose one of: ${TYPEORM_PROTOCOLS.join(', ')}`);
            }
            // @ts-ignore
            connection = yield typeorm_1.createConnection({
                type: protocol,
                url: config.connstring
            });
        }
        catch (error) {
            core.setFailed(`Unable to connect to database: ${error.message}`);
            throw error;
        }
        let result;
        try {
            result = yield connection.query(query);
        }
        catch (error) {
            core.setFailed(`Unable to query database: ${error.message}`);
            throw error;
        }
        const outfile = `${config.outfile}.${config.format}`;
        try {
            fs_1.writeFileSync(outfile, result);
        }
        catch (error) {
            core.setFailed(`Unable to write results to ${outfile}: ${error.message}`);
            throw error;
        }
    });
}
exports.default = fetchSQL;
