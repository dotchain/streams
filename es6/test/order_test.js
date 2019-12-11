"use strict";

/* eslint-env mocha, browser */

import { expect } from "./expect.js";
import { wrap, order, PathChange, Replace } from "../main.js";

describe("order", () => {
  it("wraps dict", () => {
    let s = wrap({ hello: 42, ok: 33 });
    let o = order(s, (list, x, y) => list[x] - list[y]);

    expect(JSON.stringify(s)).to.equal(JSON.stringify(o));
    expect(o.exists("hello")).to.equal(true);
    expect(o.withRef(["boo"]).ref()).to.deep.equal(["boo"]);
  });

  it("tracks dict", () => {
    let s = wrap({ hello: 42, ok: 33 });
    let o = order(s, (list, x, y) => list[x] - list[y]);

    s.hello.replace(22);

    expect(s.nextChange()).to.deep.equal(o.nextChange());

    s = s.next();
    o = o.next();

    expect(JSON.stringify(s)).to.equal(JSON.stringify(o));
  });

  it("writes through changes #1", () => {
    let s = wrap({ hello: 42, ok: 33 });
    let o = order(s, (list, x, y) => list[x] - list[y]);

    o.hello.replace(22);

    expect(s.nextChange()).to.deep.equal(o.nextChange());

    s = s.next();
    o = o.next();

    expect(JSON.stringify(s)).to.equal(JSON.stringify(o));
  });

  it("writes through changes #2", () => {
    let s = wrap({ hello: 42, ok: 33 });
    let o = order(s, (list, x, y) => list[x] - list[y]);

    o.replace({ hello: 22, ok: 33 });

    expect(s.nextChange()).to.deep.equal(o.nextChange());

    s = s.next();
    o = o.next();

    expect(JSON.stringify(s)).to.equal(JSON.stringify(o));
  });

  it("writes through changes #3", () => {
    let s = wrap({ hello: 42, ok: 33 });
    let o = order(s, (list, x, y) => list[x] - list[y]);

    o.replacePath(["hello"], 22);

    expect(s.nextChange()).to.deep.equal(o.nextChange());

    s = s.next();
    o = o.next();

    expect(JSON.stringify(s)).to.equal(JSON.stringify(o));
  });
});
