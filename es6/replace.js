"use strict";

export class Replace {
  constructor(before, after) {
    this.before = before;
    this.after = after;
  }

  apply() {
    return this.after;
  }
}
