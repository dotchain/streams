"use strict";

/* eslint-env mocha, browser */

import { expect } from "./expect.js";
import { wrap, filter } from "../main.js";

describe("filter", function() {
  it("filters", () => {
    const s = wrap({ hello: 4, world: 3, ok: 2 });
    const f = filter(s, v => v % 2 === 0);

    expect(f.valueOf()).to.deep.equal({ hello: 4, ok: 2 });
  });

  it("tracks changes", () => {
    const s = wrap({ hello: 4, world: 3, ok: 2 });
    let f = filter(s, v => v % 2 === 0);

    expect(f.valueOf()).to.deep.equal({ hello: 4, ok: 2 });

    s.hello.replace(9);
    f = f.latest();
    expect(f.valueOf()).to.deep.equal({ ok: 2 });
  });

  it("updates", () => {
    let s = wrap({ hello: 4, world: 3, ok: 2 });
    let f = filter(s, v => v % 2 === 0);

    expect(f.valueOf()).to.deep.equal({ hello: 4, ok: 2 });
    f.hello.replace(9);

    f = f.latest();
    s = s.latest();
    expect(f.valueOf()).to.deep.equal({ ok: 2 });
    expect(s.valueOf()).to.deep.equal({ hello: 9, world: 3, ok: 2 });
  });

  it("updates #2", () => {
    let s = wrap({ hello: 4, world: 3, ok: 2 });
    let f = filter(s, v => v % 2 === 0);

    expect(f.valueOf()).to.deep.equal({ hello: 4, ok: 2 });
    f.replace(null);

    s = s.latest();
    expect(s.valueOf()).to.deep.equal({ world: 3 });
  });
});
