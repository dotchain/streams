"use strict";

/* eslint-env mocha, browser */

import { expect } from "chai";
import { wrap, unwrap } from "../main.js";

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
      expect(unwrap(s)).to.deep.equal(base);
      expect(JSON.stringify(s)).to.equal(JSON.stringify(base));
    });
  }

  it("wraps dates", () => {
    let now = new Date();
    let s = wrap(now);
    expect(s.valueOf()).to.equal(now);
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

  it("unwraps", () => {
    expect(unwrap("hello")).to.equal("hello");
    expect(unwrap(wrap("hello"))).to.equal("hello");
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
