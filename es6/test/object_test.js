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

  it("replaces non-existent path", () => {
    let s1 = wrap({ hello: "world" });
    let s = object({ first: s1 });
    s = s.replacePath(["first", "boo"], "hoo");
    expect(s1.latest().boo.valueOf()).to.equal("hoo");
    expect(s.valueOf().first.valueOf()).to.deep.equal({
      hello: "world",
      boo: "hoo"
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

  it("checks if key exists", () => {
    let s = object({ boo: "hoo" });
    expect(s.exists("boo")).to.equal(true);
    expect(s.exists("hello")).to.equal(false);
  });

  it("implements ref", () => {
    const s = wrap("hello").withRef(["hello"]);
    const o = object({ obj: s });
    const o2 = o.withRef(["obj"]);
    expect(o2.ref()).to.deep.equal(["obj"]);
    expect(o.ref()).to.deep.equal([]);
    expect(o2.obj.ref()).to.deep.equal(["hello"]);
    expect(o2.ref(["obj"])).to.deep.equal(["hello"]);
  });
});
