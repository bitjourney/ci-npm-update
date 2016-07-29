# ci-npm-update [![CircleCI](https://circleci.com/gh/gfx/ci-npm-update.svg?style=svg)](https://circleci.com/gh/gfx/ci-npm-update)

This command keeps npm dependencies up-to-date, making pull-requests from CI.

For example: https://github.com/gfx/ci-npm-update/pull/13

# Usage

For CI:

```
# setup env vars in the CI dashboard:
export GITHUB_ACCESS_TOKEN=...
export GIT_USER_NAME=gfx
export GIT_USER_EMAIL=gfx@users.noreply.github.com

# and later:
ci-npm-update --execute
```

For local use:

```
# envchain is recommended to save credentils locally
envchain --set github GITHUB_ACCESS_TOKEN

# run in dry-run mode:
envchain github ci-npm-update

# run:
envchain github ci-npm-update --execute
```

# Development

Setup:

```
npm run setup
```

Easy test command in dry-run mode:

```
npm run build && envchain github node bin/ci-npm-update
```

## Heroku Scheduler

If you want to setup heroku schedulers, there's a template for it:

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/gfx/ci-npm-update)

# See Also

* [circleci-bundle-update-pr](https://github.com/masutaka/circleci-bundle-update-pr)

# License

Copyright (c) 2016 FUJI Goro (gfx).

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
