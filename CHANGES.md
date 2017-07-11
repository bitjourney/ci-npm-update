# The Reivision History of ci-npm-update

## v2.0.0 - 2017/07/11

* Support npm@5's `package-lock.json`
  * NOTE: `npm-shrinkwrap.json` is no longer supported, but you can easily migrate it to `package-lock.json`
  * See [The npm Blog — v5\.0\.0](http://blog.npmjs.org/post/161081169345/v500) for deails of npm@5
* Fix scoped packages in pull-request descriptions, esp. `@types/*`


## v1.0.9 - 2016/10/23

* Fix maxBuffer exceeded errors [#68](https://github.com/bitjourney/ci-npm-update/pull/68)

## v1.0.8 - 2016/09/30

* Avoid crashes when repository URLs are not a valid git repository (#50, #51)

## v1.0.7 - 2016/09/12

* Support git+ssh protocols (#37)

## v1.0.6 - 2016/08/27

* Fix an issue that git protocol URLs caused crashes (#31)

## v1.0.5 - 2016/08/27

* Fix issue contents

## v1.0.4 - 2016/08/19

* Fix an issue that git protocol URLs caused crashes (#24)

## v1.0.3 - 2016/08/13

* Fix issues that packages that have no repository url made broken links

## v1.0.2 - 2016/08/12

* Avoid making a pull-request when there's no diff in dependencies
* Fix repository URLs in issue bodies

## v1.0.1 - 2016/08/05

* Fix version specs in dependencies

## v1.0.0 - 2016/07/31

* Initial stable release.
