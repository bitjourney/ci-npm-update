import * as request from "request";

const USER_AGENT = "ci-npm-update/1.0";

export type GitHubPullRequestResponse = {
    id: string,
    url: string,
    html_url: string,
};

export class GitHubApi {
    endpoint: string;
    token: string;
    owner: string;
    repository: string;

    constructor(options: {
        endpoint: string,
        token: string,
        owner: string,
        repository: string
    }) {
        this.endpoint = options.endpoint;
        this.token = options.token;
        this.owner = options.owner;
        this.repository = options.repository;
    }

    createPullRequest(options: {
        title: string,
        body: string,
        head: string,
        base: string,
    }): Promise<GitHubPullRequestResponse> {
        return new Promise<GitHubPullRequestResponse>((resolve, reject) => {
            // https://developer.github.com/v3/pulls/#create-a-pull-request
            request.post(`${this.endpoint}/repos/${this.owner}/${this.repository}/pulls`,
                {
                    headers: {
                        "user-agent": USER_AGENT,
                        "authorization": `token ${this.token}`,
                    },
                    json: {
                        title: options.title,
                        body: options.body,
                        head: options.head,
                        base: options.base,
                    },
                },
                (err, _response, body) => {
                    if (err) {
                        reject(err);
                    } else if (body.errors) {
                        reject(new Error(`${body.message}: ${JSON.stringify(body.errors)}`));
                    } else {
                        resolve(body);
                    }
                });
        });
    }
}
