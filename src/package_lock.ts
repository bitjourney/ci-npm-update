import * as fs from "fs";
import { GitHubCompareView } from "./compare_view";
import { NpmConfig } from "./npm_config";

export const DEFAULT_LOCK_FILE = "package-lock.json";

export interface ShrinkWrapData {
    version: string;
    from: string;
    resolved: string;
}

export class PackageLock {

    static read(lockFile = DEFAULT_LOCK_FILE): Promise<PackageLock> {
        return new Promise<PackageLock>((resolve, reject) => {
            fs.readFile(lockFile, "utf8", (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(new PackageLock(JSON.parse(data)));
                }
            });
        });
    }

    name: string;
    version: string;

    private dependencies: Map<string, ShrinkWrapData>;

    constructor(json: any) {
        Object.assign(this, json);
    }

    getDependencyNames(): string[] {
        return Object.keys(this.dependencies);
    }

    getDependencyData(name: string): ShrinkWrapData {
        return (this.dependencies as any)[name];
    }

    getDependencyVersion(name: string): string {
        const version = this.getDependencyData(name).version;
        console.assert(version, `version of ${name}`);
        return version;
    }

    getDependencyVersionRange(name: string): string {
        const parts = this.getDependencyData(name).from.split(/@/);
        return parts[parts.length - 1];
    }

    diff(other: PackageLock): Promise<GitHubCompareView[]> {
        return new ShrinkWrapDiff(this, other).getCompareViewList();
    }
}

export class ShrinkWrapDiff {
    older: PackageLock;
    newer: PackageLock;

    constructor(older: PackageLock, newer: PackageLock) {
        this.older = older;
        this.newer = newer;
    }

    hasNoDiff(): boolean {
        return JSON.stringify(this.older) === JSON.stringify(this.newer);
    }

    getCompareViewList(): Promise<GitHubCompareView[]> {
        const older = this.older;
        const newer = this.newer;
        const union = new Set([
            ...older.getDependencyNames(),
            ...newer.getDependencyNames(),
        ]);

        const result: Array<Promise<GitHubCompareView>> = [];
        union.forEach((name) => {
            const olderOne = older.getDependencyData(name);
            const newerOne = newer.getDependencyData(name);

            if (olderOne && !newerOne) {
                // removed
                return;
            }

            if (olderOne && newerOne && olderOne.version === newerOne.version) {
                // no change
                return;
            }
            result.push(NpmConfig.getFromRegistry(name, newerOne.version)
                .then((npmConfig) => {
                    const olderVersion = olderOne ? olderOne.version : null;
                    const newerVersion = newerOne ? newerOne.version : null;
                    return new GitHubCompareView(olderVersion, newerVersion, npmConfig).toPromise();
                }));
        });
        return Promise.all(result);
    }
}
