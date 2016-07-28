import * as request from "request";

const REGISTRY_ENDPOINT = "http://registry.npmjs.org";

export class NpmConfig {

    static getFromRegistry(name: string, version: string): Promise<NpmConfig> {
        return new Promise<NpmConfig>((resolve, _reject) => {
            const url = `${REGISTRY_ENDPOINT}/${name}/${version}`;
            request(url, (err, res, body) => {
                if (err) {
                    resolve(new NpmConfig({
                        name: name,
                        version: version,
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
                        name: name,
                        version: version,
                        error: error,
                    }));
                    return;
                }
                if (json.error) {
                    const error = `Failed to get npm config from ${url}: ${json.error}`;
                    resolve(new NpmConfig({
                        name: name,
                        version: version,
                        error: error,
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

    dependencies: Map<string, string>;
    devDependencies: Map<string, string>;
    peerDependencies: Map<string, string>;

    constructor(json: any) {
        Object.assign(this, json);

        if (!this.dependencies) {
            this.dependencies = new Map<string, string>();
        }
        if (!this.devDependencies) {
            this.devDependencies = new Map<string, string>();
        }
        if (!this.peerDependencies) {
            this.peerDependencies = new Map<string, string>();
        }
    }
}
