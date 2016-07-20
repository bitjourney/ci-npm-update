
import * as fs from "fs";
import * as http from "http";

const REGISTRY_ENDPOINT = "http://registry.npmjs.org";

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

    name: string
    version: string
    dependencies: Map<string, {
        version: string;
        from: string;
        resolved: string;
    }>

    constructor(json: any) {
        Object.assign(this, json)

        Object.keys(this.dependencies).forEach((name) => {
            const metadata = (<any>this.dependencies)[name];
            console.log(`${name} ${metadata.version}`)
        })
    }

    getOutdated(): Promise<Map<string, NpmConfig>> {

        return new Promise<Map<string, NpmConfig>>((_resolve, _reject) => {
            http.get(`${REGISTRY_ENDPOINT}/`)
        });
    }

}

export class NpmConfig {

    // https://docs.npmjs.com/files/package.json

    name: string;
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