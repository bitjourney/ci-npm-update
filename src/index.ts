import { exec } from "child_process";
import * as moment from "moment";
import * as github from "./github";
import * as Issue from "./issue";
import { NpmConfig } from "./npm_config";
import { DEFAULT_LOCK_FILE, PackageLock } from "./package_lock";

function run(command: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        console.log(`>> ${command}`);
        exec(command, {
            encoding: "utf8",
            maxBuffer: 1024 * 1024,
        }, (error, stdout, stderr) => {
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

export interface Options {
    githubAccessToken: string;
    gitUserName: string;
    gitUserEmail: string;
    execute: boolean; // default to dry-run mode
}

export function setupGitConfig(gitUserName: string, gitUserEmail: string): Promise<any> {
    const setUserNamePromise = gitUserName ? run(`git config user.name '${gitUserName}'`) : Promise.resolve();
    const setUserEmailPromise = gitUserEmail ? run(`git config user.email '${gitUserEmail}'`) : Promise.resolve();
    return Promise.all<any>([setUserNamePromise, setUserEmailPromise]);
}

export async function createGitBranch(branch: string): Promise<PackageLock> {
    console.log(`Creating a branch: ${branch}`);

    await run(`git checkout -b ${branch}`);
    await run(`rm -rf node_modules ${DEFAULT_LOCK_FILE}`);

    // npm update --depth 9999 might cause OOM:
    // https://github.com/npm/npm/issues/11876
    await run(`npm install`);

    await run(`git add ${DEFAULT_LOCK_FILE}`);
    const diff = (await run("git diff --cached")).trim();

    if (diff) {
        await run(`git commit -m 'update npm dependencies'`);
    } else {
        await run("git checkout -");
        return Promise.reject(new AllDependenciesAreUpToDate());
    }

    const packageLock = await PackageLock.read();
    await run("git checkout -");
    return Promise.resolve(packageLock);
}

export async function start({
    githubAccessToken: githubAccessToken,
    gitUserName: gitUserName,
    gitUserEmail: gitUserEmail,
    execute: execute,
}: Options): Promise<string> {
    if (execute) {
        console.assert(githubAccessToken, "Missing GITHUB_ACCESS_TOKEN or --token");
    }

    const repositoryUrl = (await run("git remote get-url --push origin")).trim();

    const githubApi = new github.GitHubApi({
                repositoryUrl,
                token: githubAccessToken,
            });

    const timestamp = moment().format("YYYYMMDDhhmmss");
    const branch = `npm-update/${timestamp}`;

    await setupGitConfig(gitUserName, gitUserEmail);

    const packageLock = await PackageLock.read();
    const updatedPackageLock = await createGitBranch(branch);
    const compareViewList = await packageLock.diff(updatedPackageLock);

    if (compareViewList.length === 0) {
        // There're only diffs in sub dependencies
        // e.g. https://github.com/bitjourney/ci-npm-update/pull/21/files
        return Promise.reject(new AllDependenciesAreUpToDate());
    }

    const issue = await Issue.createBody(compareViewList, NpmConfig.readFromFile());

    console.log("-------");
    console.log(issue);
    console.log("--------");

    if (execute) {
        await run(`git push origin ${branch}`);
    } else {
        console.log("Skipped `git push` because --execute is not specified.");
    }

    const baseBranch = (await run("git rev-parse --abbrev-ref HEAD")).trim();

    if (execute) {
        const response = await githubApi.createPullRequest({
                    title: `npm update at ${new Date()}`,
                    body: issue,
                    head: branch,
                    base: baseBranch.trim(),
        });
        return Promise.resolve(response.html_url);
    } else {
        return Promise.reject(new SkipToCreatePullRequest());
    }
}
