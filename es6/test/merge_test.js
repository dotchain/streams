"use strict";

/* eslint-env mocha, browser */

import { expect } from "./expect.js";
import { wrap, merge, PathChange, Replace } from "../main.js";

describe("merge", () => {
  it("replaces path", () => {
    let s1 = wrap({ hello: "world", ok: "computer" });
    let s2 = wrap({ hello: "boo", boo: "hoo" });
    let s = merge([s1, s2]);
    s.replacePath(["hello"], "goodbye");
    expect(s.nextChange()).to.deep.equal(
      new PathChange(["hello"], new Replace("boo", "goodbye"))
    );
    s = s.latest();
    expect(JSON.parse(JSON.stringify(s))).to.deep.equal({
      hello: "goodbye",
      boo: "hoo",
      ok: "computer"
    });
    expect(s2.latest().hello.valueOf()).to.equal("goodbye");
  });

  it("replaces non-existent path", () => {
    let s1 = wrap({ hello: "world", ok: "computer" });
    let s2 = wrap({ hello: "boo", boo: "hoo" });
    let s = merge([s1, s2]);
    s.replacePath(["goku", "wukong"], "journey");
    expect(s.nextChange()).to.deep.equal(
      new PathChange(["goku", "wukong"], new Replace(null, "journey"))
    );
    s = s.latest();
    expect(JSON.parse(JSON.stringify(s))).to.deep.equal({
      hello: "boo",
      boo: "hoo",
      ok: "computer",
      goku: { wukong: "journey" }
    });
    expect(s2.latest().goku.wukong.valueOf()).to.equal("journey");
  });

  it("iterates through all keys", () => {
    let s1 = wrap({ hello: "world" });
    let s2 = wrap({ hello: "boo", boo: "hoo" });
    let s = merge([s1, s2]);
    let keys = {};
    s.forEachKey(key => {
      keys[key] = (keys[key] || 0) + 1;
      expect(s.exists(key)).to.equal(true);
    });
    expect(keys).to.deep.equal({ hello: 1, boo: 1 });
  });

  it("tracks overridden field changes #1", () => {
    let s1 = wrap({ hello: "world", ok: "computer" });
    let s2 = wrap({ hello: "boo", boo: "hoo" });
    let s = merge([s1, s2]);

    s1.hello.replace("world2");

    expect(s.nextChange()).to.deep.equal(null);
    s = s.latest();
    expect(JSON.parse(JSON.stringify(s))).to.deep.equal({
      hello: "boo",
      boo: "hoo",
      ok: "computer"
    });
  });

  it("tracks overridden field changes #2", () => {
    let s1 = wrap({ hello: "world", ok: "computer" });
    let s2 = wrap({ hello: "boo", boo: "hoo" });
    let s = merge([s1, s2]);

    s2.get("ok").replace("computer2");

    expect(s.nextChange()).to.deep.equal(
      new PathChange(["ok"], new Replace("computer", "computer2"))
    );
    s = s.latest();
    expect(JSON.parse(JSON.stringify(s))).to.deep.equal({
      hello: "boo",
      boo: "hoo",
      ok: "computer2"
    });
  });
});
