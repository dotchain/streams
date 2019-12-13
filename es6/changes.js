"use strict";

export function buildChanges(types) {
  const merge = (l, r, old) => (l ? l.merge(r, old) : { self: l, other: r });
  types.Changes = class Changes {
    static create(changes) {
      if (!changes || changes.length === 0) return null;
      if (changes.length === 1) return changes[0];
      return new Changes(changes);
    }

    constructor(changes) {
      this.changes = changes;
    }

    apply(v) {
      for (let c of this.changes) {
        v = c ? c.apply(v) : v;
      }
      return v;
    }

    merge(other, older) {
      const result = [];
      for (let kk = 0; kk < this.changes.length; kk++) {
        const merged = merge(this.changes[kk], other, older);
        if (merged.self) result.push(merged.self);
        other = merged.other;
      }
      return { self: Changes.create(result), other };
    }

    visit(pathPrefix, visitor) {
      for (let c of this.changes) {
        if (c) c.visit(pathPrefix, visitor);
      }
    }
  };
}
