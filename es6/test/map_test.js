"use strict";

/* eslint-env mocha, browser */

import { expect } from "./expect.js";
import { wrap, map } from "../main.js";

describe("map", () => {
  // uppercase converts a string stream into upper case string stream
  let uppercase = name => name.valueOf() && name.valueOf().toUpperCase();

  it("maps", () => {
    let name = wrap({ first: "joe", last: "schmoe" });
    let mapped = map(name, uppercase);

    expect(mapped.first.valueOf()).to.equal("JOE");
    expect(mapped.last.valueOf()).to.equal("SCHMOE");
  });

  it("handles key additions", () => {
    let name = wrap({ first: "joe", last: "schmoe" });
    let mapped = map(name, uppercase);

    name.get("boo").replace("hoo");

    expect(mapped.latest().boo.valueOf()).to.equal("HOO");
    expect(
      mapped
        .get("boo")
        .latest()
        .valueOf()
    ).to.equal("HOO");
  });

  it("handles key removals", () => {
    let name = wrap({ first: "joe", last: "schmoe" });
    let mapped = map(name, uppercase);

    name.last.replace(null);

    expect(
      mapped
        .latest()
        .get("last")
        .valueOf()
    ).to.equal(null);
    expect(mapped.last.latest().valueOf()).to.equal(null);
  });

  it("handles key changes", () => {
    let name = wrap({ first: "joe", last: "schmoe" });
    let mapped = map(name, uppercase);

    name.last.replace("Doe");

    expect(mapped.latest().last.valueOf()).to.equal("DOE");
    expect(mapped.last.latest().valueOf()).to.equal("DOE");
  });
});
