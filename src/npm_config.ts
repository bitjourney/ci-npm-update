const request = require("request");
import * as fs from "fs";

const REGISTRY_ENDPOINT = "http://registry.npmjs.org";

export class NpmConfig {

    static readFromFile(packageJsonFile: string = "package.json"): Promise<NpmConfig> {
        return new Promise<NpmConfig>((resolve, reject) => {
            fs.readFile(packageJsonFile, "utf8", (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(new NpmConfig(JSON.parse(data)));
                }
            });
        });
    }

    static getFromRegistry(name: string, version: string): Promise<NpmConfig> {
        return new Promise<NpmConfig>((resolve, _reject) => {
            const url = `${REGISTRY_ENDPOINT}/${name}/${version}`;
            request(url, (err: any, res: any, body: any) => {
                if (err) {
                    resolve(new NpmConfig({
                        name,
                        version,
                        error: err,
                    }));
                    return;
                }
                let json: any;
                try {
                    json = JSON.parse(body);
                } catch (e) {
                    const error = `Failed to get npm config from ${url}: ${res.statusCode} ${res.statusMessage}`;
                    resolve(new NpmConfig({
                        name,
                        version,
                        error,
                    }));
                    return;
                }
                if (json.error) {
                    const error = `Failed to get npm config from ${url}: ${json.error}`;
                    resolve(new NpmConfig({
                        name,
                        version,
                        error,
                    }));
                    return;
                }
                resolve(new NpmConfig(json));
            });
        });
    }

    // https://docs.npmjs.com/files/package.json

    name: string;
    version: string;

    repository: {
        type: string;
        url: string;
    };

    dependencies: {string: string};
    devDependencies: {string: string};
    peerDependencies: {string: string};

    constructor(json: any) {
        Object.assign(this, json);

        if (!this.dependencies) {
            this.dependencies = {} as {string: string};
        }
        if (!this.devDependencies) {
            this.devDependencies = {} as {string: string};
        }
        if (!this.peerDependencies) {
            this.peerDependencies = {} as {string: string};
        }
    }
}
