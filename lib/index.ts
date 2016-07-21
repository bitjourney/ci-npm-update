import {ShrinkWrap} from "./shrink_wrap";
//import {NpmConfig} from "./npm_config";


ShrinkWrap.read().then((shrinkWrap) => {
    return shrinkWrap.getLatest();
}).then((packageInfoList) => {
    const outdatedList = packageInfoList.filter((packageInfo) => {
        return packageInfo.isOutdated();
    });
    
    if (outdatedList.length > 0) {
        console.log("## Outdated Dependencies\n");
        outdatedList.forEach((p) => {
            if (p.hasRepositoryUrl()) {
                console.log(`* ${p.name} [${p.getVersionRange()}](${p.getDiffUrl()})`);
            } else {
                console.log(`* ${p.name} ${p.getVersionRange()}`);
            }
        });
    }
}).catch((err) => {
    console.error(err);
})