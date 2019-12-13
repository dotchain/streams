"use strict";

/* eslint-env mocha, browser */

import { expect } from "./expect.js";
import { ChangeBuilder, Replace } from "../main.js";

describe("changes", () => {
  it("merges", () => {
    const left = new ChangeBuilder();
    const right = new ChangeBuilder();

    left.replace(["hello", "world"], new Replace(1, 2));
    left.replace(["hello", "sugar"], new Replace(3, 4));
    right.replace(["hello", "sugar"], new Replace(3, 5));
    right.replace(["hello", "world"], new Replace(1, 6));

    const merged = left.result().merge(right.result());
    const initial = { hello: { world: 1, sugar: 3 } };
    const want = { hello: { world: 6, sugar: 5 } };

    const got = merged.other.apply(left.result().apply(initial));
    expect(got).to.deep.equal(want);
    expect(merged.self).to.equal(null);
  });
});
