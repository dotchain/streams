"use strict";

export function buildReplace(types) {
  // Replace represents a change that replaces one value with another.
  types.Replace = class Replace {
    constructor(before, after) {
      this.before = before;
      this.after = after;
    }

    apply() {
      return this.after;
    }

    merge(other, older) {
      return { self: this, other };
    }
  };
}
