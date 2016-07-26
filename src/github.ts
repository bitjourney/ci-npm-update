import * as request from "request";

const USER_AGENT = "ci-npm-update/1.0";

export type GitHubPullRequestResponse = {
    id: string,
    url: string,
    html_url: string,
};

export type GitHubPullRequestParameters = {
    title: string,
    body: string,
    head: string,
    base: string,
};

export class GitHubApi {

    static parseUrl(url: string): { host: string, owner: string, repository: string } {
        const matched = /^(?:git@|(?:git\+)?https:\/\/)([^\/:]+)[\/:]([^\/]+)\/([^\/]+)(?!\.git)/.exec(url);
        if (!matched) {
            throw Error(`Cannot parse git repository URL: ${url}`);
        }
        return {
            host: matched[1],
            owner: matched[2],
            repository: matched[3].replace(/\.git$/, ""),
        };
    }

    static extractEndpoint(url: string): string {
        const host = this.parseUrl(url).host;
        if (host === "github.com") {
            return "https://api.github.com";
        } else {
            // https://developer.github.com/v3/enterprise/
            return `https://${host}/api/v3`;
        }
    }
    static extractOwner(url: string): string {
        return this.parseUrl(url).owner;
    }
    static extractRepository(url: string): string {
        return this.parseUrl(url).repository;
    }

    endpoint: string;
    token: string;
    owner: string;
    repository: string;

    constructor(options: {
        repositoryUrl: string,
        token: string,
    }) {
        this.endpoint = GitHubApi.extractEndpoint(options.repositoryUrl);
        this.token = options.token;
        this.owner = GitHubApi.extractOwner(options.repositoryUrl);
        this.repository = GitHubApi.extractRepository(options.repositoryUrl);
    }

    createPullRequest(parameters: GitHubPullRequestParameters): Promise<GitHubPullRequestResponse> {
        return new Promise<GitHubPullRequestResponse>((resolve, reject) => {
            // https://developer.github.com/v3/pulls/#create-a-pull-request
            const url = `${this.endpoint}/repos/${this.owner}/${this.repository}/pulls`;
            request.post(url,
                {
                    headers: {
                        "user-agent": USER_AGENT,
                        "authorization": `token ${this.token}`,
                    },
                    json: {
                        title: parameters.title,
                        body: parameters.body,
                        head: parameters.head,
                        base: parameters.base,
                    },
                },
                (err, _response, body) => {
                    if (err) {
                        reject(err);
                    } else if (body.errors || !body.html_url) {
                        reject(new Error(`Failed to create a pull request (${url}): ${JSON.stringify(body)}`));
                    } else {
                        resolve(body);
                    }
                });
        });
    }
}
