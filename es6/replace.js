"use strict";

export function buildReplace(types) {
  // Replace represents a change that replaces one value with another.
  types.Replace = class Replace {
    constructor(before, after) {
      this.before = before;
      this.after = after;
    }

    apply(_v) {
      return this.after && this.after.toJSON ? this.after.toJSON() : this.after;
    }

    merge(other, _older) {
      return { self: this, other };
    }
  };
}
