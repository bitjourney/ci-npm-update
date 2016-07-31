// to file an issue from a package info list

import { GitHubCompareView } from "./compare_view";
import { NpmConfig } from "./npm_config";

const SIGNATURE = "[ci-npm-update](https://github.com/gfx/ci-npm-update)";

export function createBody(list: GitHubCompareView[], npmConfigPromise: Promise<NpmConfig>): Promise<string> {
    return npmConfigPromise.then((npmConfig) => {

        const map = new Map<string, GitHubCompareView>();
        list.forEach((item) => {
            map.set(item.name, item);
        });

        let s = "";

        const dependencyNames = Object.keys(npmConfig.dependencies);
        if (dependencyNames.length !== 0) {
            const head = "# Dependencies declared in package.json\n\n";
            let section = "";

            dependencyNames.forEach((name) => {
                const compareView = map.get(name);
                if (compareView) {
                    section += compareViewToMarkdown(compareView);
                    map.delete(name);
                }
            });

            if (section) {
                s += head + section;
            }
        }

        const devDependencyNames = Object.keys(npmConfig.devDependencies);
        if (devDependencyNames.length !== 0) {
            const head = "# DevDependencies declared in package.json\n\n";
            let section = "";

            devDependencyNames.forEach((name) => {
                const compareView = map.get(name);
                if (compareView) {
                    section += compareViewToMarkdown(compareView);
                    map.delete(name);
                }
            });

            if (section) {
                s += head + section;
            }
        }

        if (map.size !== 0) {
            const head = "## Dependencies not declared in package.json\n\n";
            let section = "";

            list.forEach((c) => {
                const compareView = map.get(c.name);
                if (compareView) {
                    section += compareViewToMarkdown(compareView);
                }
            });

            if (section) {
                s += head + section;
            }
        }
        s += "\n\n";
        s += "Powered by " + SIGNATURE;
        return s;
    });
}

function compareViewToMarkdown(c: GitHubCompareView): string {
    if (c.hasDiffUrl()) {
        return `* ${c.name}: [${c.getVersionRange()}](${c.getDiffUrl()})\n`;
    } else if (c.hasRepositoryUrl()) {
        return `* ${c.name} ${c.getRepositoryUrl()}\n`;
    } else {
        return `* ${c.name}`;
    }
}
