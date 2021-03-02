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
const http_1 = require("./http");
const core = __importStar(require("@actions/core"));
jest.mock('@actions/core');
test('uses filename from content-disposition', () => {
    const response = {
        headers: {
            'content-disposition': 'attachment; filename="filename.jpg"',
            'content-type': 'text/html; charset=UTF-8',
        },
    };
    const config = {
        outfile_basename: 'data',
    };
    expect(http_1.determineFilename(response, config)).toEqual('filename.jpg');
});
test('uses filename* from content-disposition', () => {
    const response = {
        headers: {
            'content-disposition': 'attachment; filename="filename.jpg"; filename*=UTF-8\'\'f%C3%AEl%E2%82%ACname.jpg',
            'content-type': 'text/html; charset=UTF-8',
        },
    };
    const config = {
        outfile_basename: 'data',
    };
    expect(http_1.determineFilename(response, config)).toEqual('fîl€name.jpg');
});
test('uses content-type if content-disposition is not supplied', () => {
    const response = {
        headers: {
            'content-type': 'text/html; charset=UTF-8',
        },
    };
    const config = {
        outfile_basename: 'data',
    };
    expect(http_1.determineFilename(response, config)).toEqual('data.html');
});
test('ignores content-type if it is unrecognized', () => {
    const response = {
        headers: {
            'content-type': 'foo/bar',
        },
    };
    const config = {
        outfile_basename: 'data',
    };
    expect(http_1.determineFilename(response, config)).toEqual('data');
});
test('Uses outfile_basename when neither content-type or content-disposition is available', () => {
    const response = {
        headers: {},
    };
    const config = {
        outfile_basename: 'data',
    };
    const coreMock = jest.spyOn(core, 'warning');
    expect(http_1.determineFilename(response, config)).toEqual('data');
    expect(coreMock).toBeCalledTimes(1);
});
