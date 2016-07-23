
import * as main from "./index";

function die(message: string) {
    console.error(message);
    process.exit(1);
}

const options: main.Options = {
    githubAccessToken: process.env.GITHUB_ACCESS_TOKEN,
    gitUserName: process.env.GIT_USER_NAME,
    gitUserEmail: process.env.GIT_USER_EMAIL,
};

const args = process.argv.splice(2);
for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--token") {
        if (++i === args.length) {
            die(`No value for ${arg}`);
        }
        options.githubAccessToken = args[i];
    } else if (arg === "--user-name") {
        if (++i === args.length) {
            die(`No value for ${arg}`);
        }
        options.gitUserName = args[i];
    } else if (arg === "--user-email") {
        if (++i === args.length) {
            die(`No value for ${arg}`);
        }
        options.gitUserEmail = args[i];
    } else {
        die(`Unknown option: ${arg}`);
    }
}

const missingArgs = <string[]>[];
if (!options.githubAccessToken) {
    missingArgs.push("GITHUB_ACCESS_TOKEN (or --token)");
}

if (missingArgs.length > 0) {
    die(`Missing arguments:${missingArgs.join(", ")}`);
}

main.start(options).then((pullRequestUrl) => {
    console.log("Successfully creqted a pull-request: %s", pullRequestUrl);
}).catch((reason) => {
    // handle expected reasons
    if (reason instanceof main.AllDependenciesAreUpToDate) {
        console.log("All the dependencies are up to date.");
        return;
    }
    // unexpected reasons are exceptions
    throw reason;
});
