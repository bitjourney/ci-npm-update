import { ShrinkWrap } from "./shrink_wrap";
import * as Issue from "./issue";
import { GitHubApi, GitHubPullRequestParameters } from "./github";
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

export class AllDependenciesAreUpToDate { }

export type Options = {
    githubAccessToken: string,
    gitUserName: string,
    gitUserEmail: string,
}

export function start({
    githubAccessToken: githubAccessToken,
    gitUserName: gitUserName,
    gitUserEmail: gitUserEmail,
}: Options): Promise<string> {
    console.assert(githubAccessToken, "Missing GITHUB_ACCESS_TOKEN or --token");
    console.assert(gitUserName, "Missing GIT_USER_NAME or --git-user-name");
    console.assert(gitUserEmail, "Missing GIT_USER_EMAIL or --git-user-email");

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
        const timestamp = moment().format("YYYY-MM-DD-hh-mm-ss");

        const branch = `npm-update/${timestamp}`;

        return run(`git checkout -b ${branch}`).then((_result) => {
            return run("npm update --depth 9999");
        }).then((_result) => {
            return run("npm shrinkwrap");
        }).then((_result) => {
            return run("git add npm-shrinkwrap.json");
        }).then((_result) => {
            return run(`git commmit -m 'npm update --depth 9999' --author '"${gitUserName}" <${gitUserEmail}>'`);
        }).then((_result) => {
            return run("git push origin HEAD");
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
    }).then(([repositoryUrl, pullRequestData]: [string, GitHubPullRequestParameters]) => {
        return new GitHubApi({
            repositoryUrl: repositoryUrl,
            token: githubAccessToken,
        }).createPullRequest(pullRequestData);
    }).then((response) => {
        return Promise.resolve(response.html_url);
    });
}
