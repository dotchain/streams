"use strict";

// Replace represents a change that replaces one value with another.
export class Replace {
  constructor(before, after) {
    this.before = before;
    this.after = after;
  }

  apply() {
    return this.after;
  }

  merge(other) {
    return { self: this, other };
  }
}
