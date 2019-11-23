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

    merge(other, older) {
      let self = this;

      if (other) {
        if (older) {
          self = new Replace(other.after, this.after);
          other = null;
        } else {
          other = new Replace(self.after, other.after);
          self = null;
        }
      }

      return { self, other };
    }

    visit(pathPrefix, visitor) {
      visitor.replace(pathPrefix, this);
    }
  };
}
