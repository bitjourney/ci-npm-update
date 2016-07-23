import { ShrinkWrap } from "./shrink_wrap";
import * as Issue from "./issue";
import { GitHubApi } from "./github";
import { exec } from "child_process";
import * as moment from "moment";

const GITHUB_ACCESS_TOKEN = process.argv[1];

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

class AllDependenciesAreUpToDate { }

ShrinkWrap.read().then((shrinkWrap) => {
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
        return run("git commmit -m 'npm update --depth 9999'");
    }).then((_result) => {
        return run("git push origin HEAD");
    }).then((_result) => {
        return run("git checkout -");
    }).then((_result) => {
        return run("git rev-parse --abbrev-ref HEAD");
    }).then((baseBranch) => {
        return Promise.resolve({
            title: `npm update at ${new Date()}`,
            body: issue,
            head: branch,
            base: baseBranch,
        });
    });
}).then((pullRequestData) => {
    return new GitHubApi({
        endpoint: "https://api.github.com",
        token: GITHUB_ACCESS_TOKEN,
        owner: "gfx",
        repository: "ci-npm-update",
    }).createPullRequest(pullRequestData);
}).then((response) => {
    console.log("Successfully creqted a pull-request: %s", response.html_url);
}).catch((err) => {

    if (err instanceof AllDependenciesAreUpToDate) {
        console.log("All the dependencies are up to date.");
        return;
    }

    throw err;
});
