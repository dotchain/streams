"use strict";

/* eslint-env mocha, browser */

import { expect } from "./expect.js";
import { wrap, merge } from "../main.js";

describe("merge", () => {
  it("replaces path", () => {
    let s1 = wrap({ hello: "world", ok: "computer" });
    let s2 = wrap({ hello: "boo", boo: "hoo" });
    let s = merge([s1, s2]);
    s.replacePath(["hello"], "goodbye");
    s = s.latest();
    expect(JSON.parse(JSON.stringify(s))).to.deep.equal({
      hello: "goodbye",
      boo: "hoo",
      ok: "computer"
    });
  });

  it("iterates through all keys", () => {
    let s1 = wrap({ hello: "world" });
    let s2 = wrap({ hello: "boo", boo: "hoo" });
    let s = merge([s1, s2]);
    let keys = {};
    s.forEachKey(key => {
      keys[key] = (keys[key] || 0) + 1;
    });
    expect(keys).to.deep.equal({ hello: 1, boo: 1 });
  });
});
