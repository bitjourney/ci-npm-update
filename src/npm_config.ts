const request = require("request");
import * as fs from "fs";

const REGISTRY_ENDPOINT = "https://registry.npmjs.org";

export interface DependencyMapType {
    readonly [name: string]: string;
}

export interface RepositoryType {
    readonly type: string;
    readonly url: string;
}

function escapePackageName(name: string) {
    return name.replace(/\//g, encodeURIComponent("/"));
}

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
            const url = `${REGISTRY_ENDPOINT}/${escapePackageName(name)}/=${encodeURIComponent(version)}`;
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

    readonly json: any;

    get name(): string {
        return this.json.name;
    }

    get version(): string {
        return this.json.version;
    }

    get description(): string | undefined | null {
        return this.json.description;
    }

    get repository(): RepositoryType {
        return this.json.repository;
    }

    dependencies: DependencyMapType;
    devDependencies: DependencyMapType;
    peerDependencies: DependencyMapType;

    constructor(json: any) {
        this.json = json;
        this.dependencies = (json.dependencies || {}) as DependencyMapType;
        this.devDependencies = (json.devDependencies || {}) as DependencyMapType;
        this.peerDependencies = (json.peerDependencies || {}) as DependencyMapType;
    }

    summary(): string {
        return `${this.name}@${this.version} - ${this.description || ""}`;
    }
}
