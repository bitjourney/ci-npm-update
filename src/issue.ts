// to file an issue from a package info list

import { GitHubCompareView } from "./compare_view";

const SIGNATURE = "[ci-npm-update](https://github.com/gfx/ci-npm-update)";

export function createBody(list: GitHubCompareView[]): string {
    let s = "## Updaing Dependencies\n\n";
    list.forEach((p) => {
        if (p.hasDiffUrl()) {
            s += `* ${p.name}: [${p.getVersionRange()}](${p.getDiffUrl()})\n`;
        } else if (p.hasRepositoryUrl()) {
            s += `* ${p.name} ${p.getRepositoryUrl()}\n`;
        }
    });
    s += "\n\n";
    s += "Powered by " + SIGNATURE;
    return s;
}
