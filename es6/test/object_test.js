"use strict";

/* eslint-env mocha, browser */

import { expect } from "./expect.js";
import { wrap, object } from "../main.js";

describe("object", () => {
  it("replaces path", () => {
    let s1 = wrap("world");
    let s = object({ hello: s1, ok: "computer" });
    s = s.replacePath(["hello"], "computer");
    
    expect(s1.latest().valueOf()).to.equal("computer");
    expect(JSON.parse(JSON.stringify(s))).to.deep.equal({
      hello: "computer",
      ok: "computer"
    });
  });

  it("iterates through all keys", () => {
    let s = object({ hello: "boo", boo: "hoo" });
    let keys = {};
    s.forEachKey(key => {
      keys[key] = (keys[key] || 0) + 1;
    });
    expect(keys).to.deep.equal({ hello: 1, boo: 1 });
  });
});
