
import * as main from "./index";

function die(message: string) {
    console.error(message);
    process.exit(1);
}

const options: main.Options = {
    githubAccessToken: process.env.GITHUB_ACCESS_TOKEN,
};

const args = process.argv.splice(2);
if (args.length === 0 && !options.githubAccessToken) {
    die(`usage: ${process.argv[1]} --token $GITHUB_ACCESS_TOKEN`);
}
for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "-t" || arg === "--token") {
        if (++i === args.length) {
            die(`No value for ${arg}`);
        }
        options.githubAccessToken = args[i];
    } else {
        die(`Unknown option: ${arg}`);
    }
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
