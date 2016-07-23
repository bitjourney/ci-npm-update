import * as fs from "fs";
import * as request from "request";
import { NpmConfig } from "./npm_config";
import { PackageInfo } from "./package_info";

const REGISTRY_ENDPOINT = "http://registry.npmjs.org";

type ShrinkWrapData = {
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

    getDependencyVersion(name: string): string {
        return (<any>this.dependencies)[name].version;
    }

    getDependencyVersionRange(name: string): string {
        return (<any>this.dependencies)[name].from.split(/@/)[1];
    }

    getLatest(): Promise<PackageInfo[]> {
        return Promise.all(this.getDependencyNames().map((name) => {
            const version = this.getDependencyVersion(name);
            const versionRange = this.getDependencyVersionRange(name);

            console.time(`${name}@${version}`);
            return new Promise<PackageInfo>((resolve, reject) => {
                request(`${REGISTRY_ENDPOINT}/${name}/${versionRange}`, (err, _res, body) => {
                    if (err) {
                        reject(err);
                    } else {
                        const npmConfig = new NpmConfig(JSON.parse(body));
                        console.timeEnd(`${name}@${version}`);
                        resolve(new PackageInfo(version, npmConfig));
                    }
                });
            });
        }));
    }
}
