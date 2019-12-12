"use strict";

/* eslint-env mocha, browser */

import { expect } from "./expect.js";
import { wrap, filter } from "../main.js";

describe("filter", function() {
  it("filters", () => {
    const s = {};
    const size = 1000;
    for (let kk = 0; kk < size; kk++) {
      s[kk] = kk;
    }
    const filtered = filter(wrap(s), v => v < 10);
    let count = 0;
    filtered.forEachKey(key => {
      count++;
    });
    expect(count).to.equal(10);
  });
});
