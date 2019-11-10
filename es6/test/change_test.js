"use strict";

/* eslint-env mocha, browser */

import { expect } from "chai";
import { wrap, wrapChange } from "../main.js";

describe("wrap(change)", () => {
  it("wraps Replace", () => {
    let s = wrap("hello");
    s.replace("world");
    let replace = JSON.parse(JSON.stringify(s.nextChange()));
    expect(wrapChange(replace)).to.deep.equal(s.nextChange());
  });
});
