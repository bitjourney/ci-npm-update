import * as path from "path";
import * as assert from "power-assert";

import { PackageLock } from "../src/package_lock";

describe("PackageLock", () => {
    context(".read", () => {
        it("reads package-lock.json", async () => {
            const packageLock = await PackageLock.read(path.join(__dirname, "fixture/package-lock.json"));
            assert(packageLock.getDependencyNames().length === 1);
            assert(packageLock.getDependencyNames()[0] === "ts-node");
        });
    });

    context(".diff", () => {
        it("calculate the diff with two package-lock.json", async () => {
            const packageLock1 = await PackageLock.read(path.join(__dirname, "fixture/package-lock.json"));
            const packageLock2 = await PackageLock.read(path.join(__dirname, "fixture/package-lock-updated.json"));

            const diffs = await packageLock1.diff(packageLock2);
            assert(diffs.length === 1);

            const diff = diffs[0];
            assert(diff.name === "ts-node");
            assert(diff.installedVersion === "1.7.3");
            assert(diff.latestVersion === "3.1.0");
            assert(diff.getRepositoryUrl() === "https://github.com/TypeStrong/ts-node");
            assert(diff.getDiffUrl() === "https://github.com/TypeStrong/ts-node/compare/v1.7.3...v3.1.0");
        });
    });
});
