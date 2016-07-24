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
        const parts = (<any>this.dependencies)[name].from.split(/@/);
        return parts[parts.length - 1];
    }

    getLatest(): Promise<PackageInfo[]> {
        return Promise.all(this.getDependencyNames().map((name) => {
            console.assert(name, "Missing library name");

            const version = this.getDependencyVersion(name);
            const versionRange = this.getDependencyVersionRange(name);

            console.time(`${name}@${version}`);
            return new Promise<PackageInfo>((resolve, reject) => {
                const url = `${REGISTRY_ENDPOINT}/${name}/${versionRange}`;
                request(url, (err, res, body) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    let json: any;
                    try {
                         json = JSON.parse(body);
                    } catch (e) {
                        // ignore errors
                        const error = `Failed to get npm config from ${url}: ${res.statusCode} ${res.statusMessage}`;
                        resolve(new PackageInfo(version, new NpmConfig({name: name, version: version, error: error})));
                        return;
                    }
                    if (json.error) {
                        // ignore errors
                        const error = `Failed to get npm config from ${url}: ${json.error}`;
                        resolve(new PackageInfo(version, new NpmConfig({name: name, version: version, error: error})));
                        return;
                    }

                    const npmConfig = new NpmConfig(json);
                    console.timeEnd(`${name}@${version}`);
                    resolve(new PackageInfo(version, npmConfig));
                });
            });
        }));
    }
}
