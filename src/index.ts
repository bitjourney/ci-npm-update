import { ShrinkWrap } from "./shrink_wrap";
import * as Issue from "./issue";
import * as github from "./github";
import { exec } from "child_process";
import * as moment from "moment";

function run(command: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        console.log(`>> ${command}`);
        exec(command, "utf8", (error, stdout, stderr) => {
            if (stdout.length > 0) {
                console.log(stdout);
            }
            if (stderr.length > 0) {
                console.error(stderr);
            }
            if (error) {
                reject(error);
            } else {
                resolve(stdout);
            }
        });
    });
}

export abstract class SkipRemainingTasks { }

export class AllDependenciesAreUpToDate extends SkipRemainingTasks { }

export class SkipToCreatePullRequest extends SkipRemainingTasks { }

export type Options = {
    githubAccessToken: string,
    gitUserName: string,
    gitUserEmail: string,
    execute: boolean, // default to dry-run mode
}

export function start({
    githubAccessToken: githubAccessToken,
    gitUserName: gitUserName,
    gitUserEmail: gitUserEmail,
    execute: execute,
}: Options): Promise<string> {
    if (execute) {
        console.assert(githubAccessToken, "Missing GITHUB_ACCESS_TOKEN or --token");
    }

    return ShrinkWrap.read().then((shrinkWrap) => {
        return shrinkWrap.getLatest();
    }).then((packageInfoList) => {
        const outdatedList = packageInfoList.filter((packageInfo) => {
            return packageInfo.isOutdated();
        });

        if (outdatedList.length === 0) {
            return Promise.reject(new AllDependenciesAreUpToDate());
        }
        console.log("");

        const issue = Issue.create(outdatedList);
        console.log(issue);
        const timestamp = moment().format("YYYYMMDDhhmmss");

        const branch = `npm-update/${timestamp}`;

        return run(`git checkout -b ${branch}`).then((_result) => {
            return run("npm update --depth 9999");
        }).then((_result) => {
            return run("npm prune");
        }).then((_result) => {
            return run("npm shrinkwrap");
        }).then((_result) => {
            return run("git add npm-shrinkwrap.json");
        }).then((_result) => {
            if (gitUserName) {
                return run(`git config user.name '${gitUserName}'`);
            } else {
                return Promise.resolve();
            }
        }).then((_result) => {
            if (gitUserEmail) {
                return run(`git config user.email '${gitUserEmail}'`);
            } else {
                return Promise.resolve();
            }
        }).then((_result) => {
            return run("git diff --cached"); // just for logging
        }).then((_result) => {
            return run(`git commit -m 'npm update --depth 9999'`);
        }).then((_result) => {
            if (execute) {
                return run("git push origin HEAD");
            } else {
                console.log("Skipped `git push` because --execute is not specified.");
                return Promise.resolve();
            }
        }).then((_result) => {
            return run("git checkout -");
        }).then((_result) => {
            return run("git rev-parse --abbrev-ref HEAD");
        }).then((baseBranch) => {
            return Promise.all([
                run("git remote get-url --push origin"),
                Promise.resolve({
                    title: `npm update at ${new Date()}`,
                    body: issue,
                    head: branch,
                    base: baseBranch,
                }),
            ]);
        });
    }).then(([repositoryUrl, pullRequestData]: [string, github.GitHubPullRequestParameters]) => {
        if (!execute) {
            return <Promise<github.GitHubPullRequestResponse>>Promise.reject(new SkipToCreatePullRequest());
        }

        return new github.GitHubApi({
            repositoryUrl: repositoryUrl,
            token: githubAccessToken,
        }).createPullRequest(pullRequestData);
    }).then((response) => {
        return Promise.resolve(response.html_url);
    });
}
