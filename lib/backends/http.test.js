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
const http_1 = __importStar(require("./http"));
const core = __importStar(require("@actions/core"));
const axios_1 = __importDefault(require("axios"));
const fs_1 = __importDefault(require("fs"));
const stream_1 = require("stream");
jest.mock('@actions/core');
jest.mock('axios');
jest.mock('fs');
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
it('fetches data over HTTP', () => __awaiter(void 0, void 0, void 0, function* () {
    const config = {
        outfile_basename: 'data',
        http_url: 'https://foo.bar',
    };
    const mockWritable = new stream_1.PassThrough();
    const mockReadable = new stream_1.PassThrough();
    const response = {
        headers: {
            'content-disposition': 'attachment; filename="lala.txt"',
            'content-type': 'text/plain; charset=UTF-8',
        },
        data: mockReadable,
    };
    //@ts-ignore
    axios_1.default.get.mockResolvedValue(response);
    //@ts-ignore
    fs_1.default.createWriteStream.mockReturnValueOnce(mockWritable);
    mockWritable.end();
    expect(yield http_1.default(config)).toBe('lala.txt');
}));
it('throws an error if HTTP request fails', () => __awaiter(void 0, void 0, void 0, function* () {
    const config = {
        outfile_basename: 'data',
        http_url: 'https://foo.bar',
    };
    const err = new Error('oh snap');
    //@ts-ignore
    axios_1.default.get.mockRejectedValue(err);
    yield expect(http_1.default(config)).rejects.toEqual(err);
}));
