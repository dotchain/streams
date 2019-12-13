"use strict";

export function buildReplace(types) {
  // Replace represents a change that replaces one value with another.
  types.Replace = class Replace {
    constructor(before, after) {
      if (before && before.toJSON) before = before.toJSON();
      if (after && after.toJSON) after = after.toJSON();
      this.before = before;
      this.after = after;
    }

    apply(_v) {
      return this.after && this.after.toJSON ? this.after.toJSON() : this.after;
    }

    merge(other, older) {
      if (!other) return { self: this, other };
      if (!(other instanceof Replace)) {
        const merged = other.merge(this, !older);
        return { self: merged.other, other: merged.self };
      }

      if (older) {
        const r = new Replace(other.after, this.after);
        return { self: r, other: null };
      }

      other = new Replace(this.after, other.after);
      return { self: null, other };
    }

    visit(pathPrefix, visitor) {
      visitor.replace(pathPrefix, this);
    }
  };
}
