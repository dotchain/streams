"use strict";

export function buildPathChange(types) {
  const apply = (c, v) => (c ? c.apply(v) : v);
  const commonPathLen = (p1, p2) => {
    if (p1.length === 0 || p2.length === 0) return 0;
    let i = 0;
    for (; p1.length > 0 && p2.length > 0 && p1[i] === p2[i]; i++);
    return i;
  };

  // PathChange represents a change at a path
  types.PathChange = class PathChange {
    constructor(path, change) {
      if (change === null) return null;
      if (path.length === 0) return change;

      this.path = path;
      this.change = change;
    }

    apply(to) {
      let rest = new PathChange(this.path.slice(1), this.change);
      let result = {};
      to = to || {};
      for (let key in to) {
        if (!to.hasOwnProperty(key) || key == this.path[0]) continue;
        result[key] = to[key];
      }
      // TODO: set nullable values?
      result[this.path[0]] = apply(rest, to[this.path[0]]);
      return result;
    }

    merge(other, older) {
      if (other === null) return { self: this, other };

      if (other instanceof types.Replace) {
        other = new types.Replace(this.apply(other.before), other.after);
        return { self: null, other };
      }

      const len = commonPathLen(this.path, other.path);
      if (len != this.path.length && len != other.path.length) {
        return { self: this, other };
      }

      let self = this;
      const prefix = this.path.slice(0, len);
      if (len === this.path.length) {
        other = new PathChange(other.path.slice(len), other.change);
      } else {
        self = new PathChange(this.path.slice(len), this.change);
      }

      const merged = self.change.merge(other.change, older);
      const s = new PathChange(prefix, merged.self);
      const o = new PathChange(prefix, merged.other);
      return { self: s, other: o };
    }

    visit(pathPrefix, visitor) {
      // TODO: use fake objects instead of arrays for perf
      this.change.visit(pathPrefix.concat(this.path), visitor);
    }
  };
}
