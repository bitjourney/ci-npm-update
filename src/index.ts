import { ShrinkWrap } from "./shrink_wrap";
import { Issue } from "./issue";

ShrinkWrap.read().then((shrinkWrap) => {
    return shrinkWrap.getLatest();
}).then((packageInfoList) => {
    const outdatedList = packageInfoList.filter((packageInfo) => {
        return packageInfo.isOutdated();
    });

    if (outdatedList.length > 0) {
        console.log(Issue.create(outdatedList));
    }
});