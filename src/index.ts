import { ShrinkWrap } from "./shrink_wrap";
import { NpmConfig } from "./npm_config";
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

export function setupGitConfig(gitUserName: string, gitUserEmail: string): Promise<void> {
    const setUserNamePromise = gitUserName ? run(`git config user.name '${gitUserName}'`) : Promise.resolve();
    const setUserEmailPromise = gitUserEmail ? run(`git config user.email '${gitUserEmail}'`) : Promise.resolve();
    return Promise.all([setUserNamePromise, setUserEmailPromise]);
}

export function createGitBranch(branch: string): Promise<ShrinkWrap> {
    console.log(`Creating a branch: ${branch}`);

    return run(`git checkout -b ${branch}`).then(() => {
        // npm update --depth 9999 might cause OOM:
        // https://github.com/npm/npm/issues/11876
        return run("rm -rf node_modules npm-shrinkwrap.json ; npm install");
    }).then(() => {
        // https://github.com/npm/npm/issues/11189
        return run("npm shrinkwrap --dev");
    }).then(() => {
        return run("git add npm-shrinkwrap.json");
    }).then(() => {
        return run("git diff --cached");
    }).then((diff) => {
        if (diff.trim()) {
            return run(`git commit -m 'update npm dependencies'`);
        } else {
            return run("git checkout -").then(() => {
                return Promise.reject(new AllDependenciesAreUpToDate());
            });
        }
    }).then(() => {
        return ShrinkWrap.read();
    }).then((shrinkWrap) => {
        return Promise.all([
            Promise.resolve(shrinkWrap),
            run("git checkout -"),
        ]);
    }).then(([shrinkWrap]) => {
        return Promise.resolve(shrinkWrap);
    });
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

    const timestamp = moment().format("YYYYMMDDhhmmss");
    const branch = `npm-update/${timestamp}`;

    return setupGitConfig(gitUserName, gitUserEmail).then(() => {
        return ShrinkWrap.read();
    }).then((shrinkWrap) => {
        return Promise.all([
            Promise.resolve(shrinkWrap),
            createGitBranch(branch),
        ]);
    }).then(([current, updated]) => {
        return current.diff(updated);
    }).then((shrinkWrapDiff) => {
        return shrinkWrapDiff.getCompareViewList();
    }).then((compareViewList) => {
        return Issue.createBody(compareViewList, NpmConfig.readFromFile());
    }).then((issue) => {
        console.log("-------");
        console.log(issue);
        console.log("--------");

        let gitPushPromise: Promise<void>;
        if (execute) {
            gitPushPromise = run(`git push origin ${branch}`);
        } else {
            console.log("Skipped `git push` because --execute is not specified.");
            gitPushPromise = Promise.resolve();
        }

        return gitPushPromise.then((_result) => {
            return run("git rev-parse --abbrev-ref HEAD");
        }).then((baseBranch) => {
            return Promise.all([
                run("git remote get-url --push origin"),
                Promise.resolve({
                    title: `npm update at ${new Date()}`,
                    body: issue,
                    head: branch,
                    base: baseBranch.trim(),
                }),
            ]);
        });
    }).then(([repositoryUrl, pullRequestData]: [string, github.GitHubPullRequestParameters]) => {
        if (!execute) {
            return <Promise<github.GitHubPullRequestResponse>>Promise.reject(new SkipToCreatePullRequest());
        }

        return new github.GitHubApi({
            repositoryUrl: repositoryUrl.trim(),
            token: githubAccessToken,
        }).createPullRequest(pullRequestData);
    }).then((response) => {
        return Promise.resolve(response.html_url);
    });
}
