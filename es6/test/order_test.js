"use strict";

/* eslint-env mocha, browser */

import { expect } from "./expect.js";
import { wrap, order, orderBy } from "../main.js";

describe("order", () => {
  function keys(s) {
    const result = [];
    s.forEachKey(key => result.push(key) && false);
    return result;
  }

  it("wraps dict", () => {
    let s = wrap({ hello: 42, ok: 33 });
    let o = order(s, (x, y) => x - y);

    expect(JSON.stringify(s)).to.equal(JSON.stringify(o));
    expect(o.exists("hello")).to.equal(true);
    expect(o.withRef(["boo"]).ref()).to.deep.equal(["boo"]);

    expect(keys(o)).to.deep.equal(["ok", "hello"]);
  });

  it("tracks dict", () => {
    let s = wrap({ hello: 42, ok: 33 });
    let o = order(s, (x, y) => x - y);

    s.hello.replace(22);

    expect(s.nextChange()).to.deep.equal(o.nextChange());
    expect(keys(o.latest())).to.deep.equal(["hello", "ok"]);

    s = s.next();
    o = o.next();

    expect(JSON.stringify(s)).to.equal(JSON.stringify(o));
  });

  it("writes through changes #1", () => {
    let s = wrap({ hello: 42, ok: 33 });
    let o = order(s, (x, y) => x - y);

    o.hello.replace(22);

    expect(s.nextChange()).to.deep.equal(o.nextChange());
    expect(keys(o.latest())).to.deep.equal(["hello", "ok"]);

    s = s.next();
    o = o.next();

    expect(JSON.stringify(s)).to.equal(JSON.stringify(o));
  });

  it("writes through changes #2", () => {
    let s = wrap({ hello: 42, ok: 33 });
    let o = order(s, (x, y) => x - y);

    o.replace({ hello: 22, ok: 33 });

    expect(s.nextChange()).to.deep.equal(o.nextChange());
    expect(keys(o.latest())).to.deep.equal(["hello", "ok"]);

    s = s.next();
    o = o.next();

    expect(JSON.stringify(s)).to.equal(JSON.stringify(o));
  });

  it("writes through changes #3", () => {
    let s = wrap({ hello: 42, ok: 33 });
    let o = order(s, (x, y) => x - y);

    o.replacePath(["hello"], 22);

    expect(s.nextChange()).to.deep.equal(o.nextChange());
    expect(keys(o.latest())).to.deep.equal(["hello", "ok"]);

    s = s.next();
    o = o.next();

    expect(JSON.stringify(s)).to.equal(JSON.stringify(o));
  });

  it("sorts with orderBy", () => {
    let s = wrap({ hello: 42, ok: 33 });
    let o = orderBy(s, x => x);

    expect(JSON.stringify(s)).to.equal(JSON.stringify(o));
    expect(o.exists("hello")).to.equal(true);
    expect(o.withRef(["boo"]).ref()).to.deep.equal(["boo"]);

    expect(keys(o)).to.deep.equal(["ok", "hello"]);
  });

  it("implements ref", () => {
    let s = wrap({ hello: 42, ok: 33 }).withRef(["hey"]);
    let o = orderBy(s, x => x);
    let ok = o.withRef(["ok"]);

    expect(o.ref()).to.deep.equal(["hey"]);
    expect(ok.ref()).to.deep.equal(["ok"]);
  });
});
