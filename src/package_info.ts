import * as semver from "semver";
import { NpmConfig } from "./npm_config";


export class PackageInfo {
    name: string;

    installedVersion: string;
    latestVersion: string;

    repositoryUrl: string;

    static fixupUrl(url: string): string {
        const matched = /:\/\/(github.com\/[^\/]+\/[^\.\/]+)/.exec(url);
        return matched ? `https://${matched[1]}` : url;
    }

    constructor(installedVersion: string, npmConfig: NpmConfig) {
        this.name = npmConfig.name;
        this.installedVersion = installedVersion;
        this.latestVersion = npmConfig.version;
        this.repositoryUrl = PackageInfo.fixupUrl(npmConfig.repository.url);
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