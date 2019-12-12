"use strict";

/* eslint-env mocha, browser */

import { expect } from "./expect.js";
import { wrap, map, PathChange, Replace } from "../main.js";

describe("map", () => {
  // uppercase converts a string stream into upper case string stream
  let uppercase = (name, _key) =>
    name.valueOf() && name.valueOf().toUpperCase();

  it("maps", () => {
    let name = wrap({ first: "joe", last: "schmoe" });
    let mapped = map(name, uppercase);

    expect(mapped.exists("first")).to.equal(true);
    expect(mapped.exists("boo")).to.equal(false);

    expect(mapped.first.valueOf()).to.equal("JOE");
    expect(mapped.last.valueOf()).to.equal("SCHMOE");

    expect(JSON.parse(JSON.stringify(mapped))).to.deep.equal({
      first: "JOE",
      last: "SCHMOE"
    });

    expect(mapped.get("first").valueOf()).to.equal("JOE");
    expect(mapped.get("last").valueOf()).to.equal("SCHMOE");

    const keys = [];
    mapped.forEachKey(key => {
      keys.push(key);
    });
    expect(JSON.stringify(keys)).to.deep.equal(`["first","last"]`);
  });

  it("handles key additions", () => {
    let name = wrap({ first: "joe", last: "schmoe" });
    let mapped = map(name, uppercase);

    name.get("boo").replace("hoo");

    expect(mapped.latest().boo.valueOf()).to.equal("HOO");
    const boo = mapped.get("boo").latest();
    expect(boo.valueOf()).to.equal("HOO");

    const c = new PathChange(["boo"], new Replace(null, "HOO"));
    expect(mapped.nextChange()).to.deep.equal(c);
  });

  it("handles key removals", () => {
    let name = wrap({ first: "joe", last: "schmoe" });
    let mapped = map(name, uppercase);

    name.last.replace(null);

    const last = mapped.latest().get("last");
    expect(last.valueOf()).to.equal(null);
    expect(mapped.last.latest().valueOf()).to.equal(null);

    const c = new PathChange(["last"], new Replace("SCHMOE", null));
    expect(mapped.nextChange()).to.deep.equal(c);
  });

  it("handles key changes", () => {
    let name = wrap({ first: "joe", last: "schmoe" });
    let mapped = map(name, uppercase);

    name.last.replace("Doe");

    expect(mapped.latest().last.valueOf()).to.equal("DOE");
    expect(mapped.last.latest().valueOf()).to.equal("DOE");

    const c = new PathChange(["last"], new Replace("SCHMOE", "DOE"));
    expect(mapped.nextChange()).to.deep.equal(c);
  });

  it("handles deep changes", () => {
    let x = wrap({ first: { second: 5 } });
    let mapped = map(x, val => val.second);

    expect(JSON.stringify(mapped)).to.equal(`{"first":5}`);
    x.first.second.replace(7);
    expect(JSON.stringify(mapped.latest())).to.equal(`{"first":7}`);
  });
});
