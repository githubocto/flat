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
const config_1 = require("./config");
const core = __importStar(require("@actions/core"));
jest.mock('@actions/core');
it('returns an HTTP config', () => {
    const config = {
        http_url: 'https://google.com',
        outfile_basename: 'data',
        sql_queryfile: 'query.sql',
        sql_format: 'json',
    };
    const coreMock = jest.spyOn(core, 'getInput');
    // @ts-ignore
    coreMock.mockImplementation(k => config[k]);
    expect(config_1.getConfig()).toEqual({
        http_url: 'https://google.com',
        outfile_basename: 'data',
    });
});
it('returns a SQL config', () => {
    const config = {
        sql_connstring: 'SECRETDATAHERE',
        outfile_basename: 'data',
        sql_queryfile: 'query.sql',
        sql_format: 'json',
    };
    const coreMock = jest.spyOn(core, 'getInput');
    // @ts-ignore
    coreMock.mockImplementation(k => config[k]);
    expect(config_1.getConfig()).toEqual({
        sql_connstring: 'SECRETDATAHERE',
        outfile_basename: 'data',
        sql_queryfile: 'query.sql',
        sql_format: 'json',
    });
});
it('throws an error for a faulty HTTP config', () => {
    const config = {
        http_url: 'https://google.com',
        sql_queryfile: 'query.sql',
        sql_format: 'json',
    };
    const coreMock = jest.spyOn(core, 'getInput');
    // @ts-ignore
    coreMock.mockImplementation(k => config[k]);
    expect(config_1.getConfig).toThrowError(/^Invalid configuration!/);
});
it('throws an error for a faulty SQL config', () => {
    const config = {
        sql_connstring: 'SECRETDATAHERE',
        outfile_basename: 'data',
        sql_queryfile: 'query.sql',
    };
    const coreMock = jest.spyOn(core, 'getInput');
    // @ts-ignore
    coreMock.mockImplementation(k => config[k]);
    expect(config_1.getConfig).toThrowError(/^Invalid configuration!/);
});
it('throws an error if neither HTTP nor SQL is configured', () => {
    const config = {
        outfile_basename: 'data',
        sql_queryfile: 'query.sql',
        sql_format: 'json',
    };
    const coreMock = jest.spyOn(core, 'getInput');
    // @ts-ignore
    coreMock.mockImplementation(k => config[k]);
    expect(config_1.getConfig).toThrowError('One of `http_url` or `sql_connstring` inputs are required.');
});
it('prefers HTTP configs', () => {
    const config = {
        http_url: 'https://google.com',
        sql_connstring: 'SECRETDATAHERE',
        outfile_basename: 'data',
        sql_queryfile: 'query.sql',
        sql_format: 'json',
    };
    const coreMock = jest.spyOn(core, 'getInput');
    // @ts-ignore
    coreMock.mockImplementation(k => config[k]);
    expect(config_1.getConfig()).toEqual({
        http_url: 'https://google.com',
        outfile_basename: 'data',
    });
});
it('accepts a postprocess string', () => {
    const config = {
        http_url: 'https://google.com',
        outfile_basename: 'data',
        sql_queryfile: 'query.sql',
        sql_format: 'json',
        postprocess: 'path/to/script.ts',
    };
    const coreMock = jest.spyOn(core, 'getInput');
    // @ts-ignore
    coreMock.mockImplementation(k => config[k]);
    expect(config_1.getConfig()).toEqual({
        http_url: config.http_url,
        outfile_basename: config.outfile_basename,
        postprocess: config.postprocess,
    });
});
it('correctly identifies configs', () => {
    const http = {
        http_url: 'https://google.com',
        outfile_basename: 'data',
        sql_queryfile: 'query.sql',
        sql_format: 'json',
        postprocess: 'path/to/script.ts',
    };
    const sql = {
        sql_connstring: 'SECRETDATAHERE',
        outfile_basename: 'data',
        sql_queryfile: 'query.sql',
        sql_format: 'json',
    };
    expect(config_1.isHTTPConfig(http)).toEqual(true);
    expect(config_1.isHTTPConfig(sql)).toEqual(false);
    expect(config_1.isSQLConfig(sql)).toEqual(true);
    expect(config_1.isSQLConfig(http)).toEqual(false);
});
