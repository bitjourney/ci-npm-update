import * as fs from "fs";
import { GitHubCompareView } from "./compare_view";
import { NpmConfig } from "./npm_config";

export type ShrinkWrapData = {
    version: string;
    from: string;
    resolved: string;
};

export class ShrinkWrap {

    static read(shrinkwrapFile = "npm-shrinkwrap.json"): Promise<ShrinkWrap> {
        return new Promise<ShrinkWrap>((resolve, reject) => {
            fs.readFile(shrinkwrapFile, "utf8", (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(new ShrinkWrap(JSON.parse(data)));
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
        return (<any>this.dependencies)[name];
    }

    getDependencyVersion(name: string): string {
        return this.getDependencyData(name).version;
    }

    getDependencyVersionRange(name: string): string {
        const parts = this.getDependencyData(name).from.split(/@/);
        return parts[parts.length - 1];
    }

    diff(other: ShrinkWrap): Promise<ShrinkWrapDiff> {
        return Promise.resolve(new ShrinkWrapDiff(this, other));
    }
}

export class ShrinkWrapDiff {
    older: ShrinkWrap;
    newer: ShrinkWrap;

    constructor(older: ShrinkWrap, newer: ShrinkWrap) {
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

        const result: Promise<GitHubCompareView>[] = [];
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
