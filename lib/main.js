"use strict";
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
const core_1 = __importDefault(require("@actions/core"));
const wretch_1 = __importDefault(require("wretch"));
wretch_1.default().polyfills({
    fetch: require('node-fetch')
});
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        const url = core_1.default.getInput('url');
        if (!url) {
            core_1.default.setFailed('Workflow requires a url to fetch!');
            return;
        }
        wretch_1.default(url)
            .get()
            .res(response => {
            console.log("Fetched: ", response.type);
        })
            .catch(error => {
            console.error(error);
        });
    });
}
