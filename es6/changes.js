"use strict";

export function buildChanges(types) {
  types.Changes = class Changes {
    constructor(changes) {
      if (!changes || changes.length === 0) return null;
      if (changes.length === 0) return changes[0];
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
        const c = this.changes[kk];
        if (!c) continue;
        const merged = c.merge(other, older);
        if (merged.self) result.push(merged.self);
        other = merged.other;
      }
      return { self: new Changes(result), other };
    }

    visit(pathPrefix, visitor) {
      for (let c of this.changes) {
        if (c) c.visit(pathPrefix, visitor);
      }
    }
  };
}
