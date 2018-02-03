import { GitHubApi } from "./github";
import { NpmConfig } from "./npm_config";

export class GitHubCompareView {

    static fixupUrl(repository: { url: string } | undefined): string | null {
        if (!(repository && repository.url)) {
            return null;
        }
        try {
            const data = GitHubApi.parseUrl(repository.url);
            return `https://${data.host}/${data.owner}/${data.repository}`;
        } catch (e) {
            return null;
        }
    }

    name: string;

    installedVersion: string | null;
    latestVersion: string | null;

    repositoryUrl: string | null;

    constructor(installedVersion: string | null, latestVersion: string | null, npmConfig: NpmConfig) {
        this.name = npmConfig.name || "(undefined name)";
        this.installedVersion = installedVersion;
        this.latestVersion = latestVersion;
        this.repositoryUrl = GitHubCompareView.fixupUrl(npmConfig.repository);
    }

    hasRepositoryUrl(): boolean {
        return this.repositoryUrl ? true : false;
    }

    getRepositoryUrl(): string | null {
        return this.repositoryUrl;
    }

    hasDiffUrl(): boolean {
        return (this.installedVersion && this.latestVersion) ? true : false;
    }

    getVersionRange(): string {
        return `v${this.installedVersion}...v${this.latestVersion}`;
    }

    getDiffUrl(): string {
        return `${this.repositoryUrl}/compare/${this.getVersionRange()}`;
    }

    toPromise(): Promise<GitHubCompareView> {
        return Promise.resolve(this);
    }
}
