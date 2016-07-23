// to file an issue from a package info list

import { PackageInfo } from "./package_info";

export function create(list: PackageInfo[]): string {
    let s = "## Outdated Dependencies\n\n";
    list.forEach((p) => {
        if (p.hasRepositoryUrl()) {
            s += `* ${p.name} [${p.getVersionRange()}](${p.getDiffUrl()})\n`;
        } else {
            s += `* ${p.name} ${p.getVersionRange()}\n`;
        }
    });
    return s;
}
