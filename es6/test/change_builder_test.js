"use strict";

/* eslint-env mocha, browser */

import { expect } from "./expect.js";
import { ChangeBuilder, Replace, PathChange } from "../main.js";

describe("ChangeBuilder", () => {
  it("returns null result for empty list", () => {
    const builder = new ChangeBuilder();
    expect(builder.result()).to.equal(null);
  });

  it("returns a single root change directly", () => {
    const builder = new ChangeBuilder();
    builder.replace([], new Replace("", "ok"));
    expect(builder.result()).to.deep.equal(new Replace("", "ok"));
  });

  it("returns a single path change directly", () => {
    const builder = new ChangeBuilder();
    builder.replace(["hello"], new Replace("", "ok"));
    const expected = new PathChange(["hello"], new Replace("", "ok"));
    expect(builder.result()).to.deep.equal(expected);
  });

  it("correctly deals with multiple replaces", () => {
    const builder = new ChangeBuilder();
    builder.replace([], new Replace("", "ok"));
    builder.replace([], new Replace("ok", "boo"));
    expect(builder.result()).to.deep.equal(new Replace("", "boo"));
  });
});
