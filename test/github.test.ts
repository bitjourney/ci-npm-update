import * as assert from "power-assert";
import { GitHubApi } from "../lib/github";

const githubDataSet = {
    "github ssh url": "git@github.com:foo/something.useful.git",
    "github https url": "https://github.com/foo/something.useful",
    "github https+git url": "https://github.com/foo/something.useful.git",
};
const gheDataSet = {
    "ghe ssh url": "git@ghe.example.com:foo/something.useful.git",
    "ghe https url": "https://ghe.example.com/foo/something.useful",
    "ghe https+git url": "https://ghe.example.com/foo/something.useful.git",
};
describe("GitHubApi", () => {
    context("github.com", () => {
        Object.keys(githubDataSet).forEach((name) => {
            const url = <string>(<any>githubDataSet)[name];

            it(`extract "endpoint" from ${name}`, () => {
                assert(GitHubApi.extractEndpoint(url) === "https://api.github.com");
            });

            it(`extract "owner" from ${name}`, () => {
                assert(GitHubApi.extractOwner(url) === "foo");
            });

            it(`extract "repository" from ${name}`, () => {
                assert(GitHubApi.extractRepository(url) === "something.useful");
            });
        });
    });

    context("ghe", () => {
        Object.keys(gheDataSet).forEach((name) => {
            const url = <string>(<any>gheDataSet)[name];

            it(`extract "endpoint" from ${name}`, () => {
                assert(GitHubApi.extractEndpoint(url) === "https://ghe.example.com/api/v3");
            });

            it(`extract "owner" from ${name}`, () => {
                assert(GitHubApi.extractOwner(url) === "foo");
            });

            it(`extract "repository" from ${name}`, () => {
                assert(GitHubApi.extractRepository(url) === "something.useful");
            });
        });
    });
});

