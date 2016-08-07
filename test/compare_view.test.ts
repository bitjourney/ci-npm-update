import * as assert from "power-assert";
import { GitHubCompareView } from "../src/compare_view";

describe("CompareView", () => {
    context(".fixupUrl", () => {
        it("can fix https uri", () => {
            assert(GitHubCompareView.fixupUrl({
                url: "https://github.com/bitjourney/ci-npm-update.git",
            }) === "https://github.com/bitjourney/ci-npm-update");
        });

        it("can fix git SSH uri", () => {
            assert(GitHubCompareView.fixupUrl({
                url: "git@github.com:bitjourney/ci-npm-update.git",
            }) === "https://github.com/bitjourney/ci-npm-update");
        });

        it("can fix git+https uri", () => {
            assert(GitHubCompareView.fixupUrl({
                url: "git+https://github.com/bitjourney/ci-npm-update",
            }) === "https://github.com/bitjourney/ci-npm-update");
        });
    });
});
