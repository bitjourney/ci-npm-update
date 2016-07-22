

export class NpmConfig {

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