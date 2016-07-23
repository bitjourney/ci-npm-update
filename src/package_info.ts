import * as semver from "semver";
import { NpmConfig } from "./npm_config";

export class PackageInfo {

    static fixupUrl(repository: { url: string }): string {
        if (!(repository && repository.url)) {
            return null;
        }
        // url can be: git+https://github.com/foo/bar.git
        const matched = /:\/\/([^\/]+\/[^\/]+\/[^\.\/]+)/.exec(repository.url);
        return matched ? `https://${matched[1]}` : repository.url;
    }

    name: string;

    installedVersion: string;
    latestVersion: string;

    repositoryUrl: string;

    constructor(installedVersion: string, npmConfig: NpmConfig) {
        this.name = npmConfig.name;
        this.installedVersion = installedVersion;
        this.latestVersion = npmConfig.version;
        this.repositoryUrl = PackageInfo.fixupUrl(npmConfig.repository);
    }

    isOutdated(): boolean {
        return semver.compare(this.installedVersion, this.latestVersion) < 0;
    }

    hasRepositoryUrl(): boolean {
        return this.repositoryUrl ? true : false;
    }

    getVersionRange(): string {
        return `v${this.installedVersion}...v${this.latestVersion}`;
    }

    getDiffUrl(): string {
        return `${this.repositoryUrl}/compare/${this.getVersionRange()}`;
    }
}
