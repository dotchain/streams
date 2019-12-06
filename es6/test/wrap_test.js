"use strict";

/* eslint-env mocha, browser */

import { expect } from "./expect.js";
import { wrap } from "../main.js";

describe("wrap(basic types)", () => {
  const cases = {
    strings: "hello",
    true: true,
    false: false,
    number: 5.3,
    date: { type: "date", value: Date.now() },
    null: null
  };

  for (let test in cases) {
    it(`wraps ${test}`, () => {
      let base = cases[test];
      let s = wrap(base);
      if (test != "date") {
        expect(s.valueOf()).to.deep.equal(base);
      }
      expect(JSON.stringify(s)).to.equal(JSON.stringify(base));
      expect(s.ref().length).to.equal(0);
    });
  }

  it("wraps dates", () => {
    let now = new Date();
    let s = wrap(now);
    expect(s.valueOf()).to.equal(now);
  });
});

describe("tracks ref", () => {
  let s = wrap("hello").withRef(["booya"]);
  expect(JSON.stringify(s.replace("ok").ref())).to.equal(`["booya"]`);
  expect(JSON.stringify(s.latest().ref())).to.equal(`["booya"]`);
});

describe("wrap(dict)", () => {
  it("wraps dicts", () => {
    let s = wrap({ hello: "world", boo: "hoo" });
    expect(s.hello.valueOf()).to.equal("world");
    expect(s.boo.valueOf()).to.equal("hoo");

    let gb = s.hello.replace("goodbye");
    expect(gb.valueOf()).to.equal("goodbye");
    expect(s.latest().hello.valueOf()).to.equal("goodbye");

    expect(JSON.stringify(s.hello.ref())).to.deep.equal(`["hello"]`);
  });

  it("merges unrelated keys", () => {
    let s = wrap({});
    s.get("x")
      .get("a")
      .replace("a");
    s.get("x")
      .get("b")
      .replace("b");
    s.get("x")
      .get("c")
      .replace("c");

    expect(JSON.parse(JSON.stringify(s.latest()))).to.deep.equal({
      x: {
        a: "a",
        b: "b",
        c: "c"
      }
    });
  });
});

describe("wrap(string)", () => {
  it("converts to native as needed ", () => {
    let s = wrap("hello");
    expect("" + s).to.equal("hello");
    expect(JSON.stringify(s)).to.equal(`"hello"`);
  });

  it("double wraps", () => {
    let s = wrap("hello");
    expect(wrap(s) + "").to.equal("hello");
  });

  it("replaces", () => {
    let s = wrap("hello");
    expect(s.replace("world") + "").to.equal("world");
  });

  it("implements next", () => {
    let s1 = wrap("hello");
    expect(s1.next()).to.equal(null);

    let s2 = s1.replace("world");
    expect(s1.next() + "").to.equal("" + s2);
  });

  it("implements latest", () => {
    let s1 = wrap("hello");
    s1.replace("boo");
    s1.replace("hoo");
    expect(s1.latest() + "").to.equal("hoo");
  });

  it("ignores apply(null)", () => {
    let s = wrap("hello");
    expect(s.apply(null)).to.equal(s);
  });
});
