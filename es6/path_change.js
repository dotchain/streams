"use strict";

export function buildPathChange(types) {
  const valueOf = x => x && x.valueOf();
  const apply = (c, v) => (c ? c.apply(v) : v);
  const commonPathLen = (p1, p2) => {
    if (p1.length === 0 || p2.length === 0) return 0;
    let i = 0;
    for (; i < p1.length && i < p2.length && p1[i] === p2[i]; i++);
    return i;
  };

  // PathChange represents a change at a path
  types.PathChange = class PathChange {
    static create(path, change) {
      if (change === null) return null;
      if (path.length === 0) return change;
      return new PathChange(path, change);
    }

    constructor(path, change) {
      this.path = path;
      this.change = change;
    }

    apply(to) {
      let rest = PathChange.create(this.path.slice(1), this.change);
      let result = {};
      to = valueOf(to || {});
      for (let key in to) {
        if (!to.hasOwnProperty(key) || key == this.path[0]) continue;
        result[key] = valueOf(to[key]);
      }

      const v = apply(rest, to[this.path[0]]);
      if (v !== null) result[this.path[0]] = v;
      return result;
    }

    merge(other, older) {
      if (other === null) return { self: this, other };

      if (other instanceof types.Replace) {
        other = new types.Replace(this.apply(other.before), other.after);
        return { self: null, other };
      }

      if (!(other instanceof types.PathChange)) {
        const merged = other.merge(this, !older);
        return { self: merged.other, other: merged.self };
      }

      const len = commonPathLen(this.path, other.path);
      if (len != this.path.length && len != other.path.length) {
        return { self: this, other };
      }

      let self = this;
      const prefix = this.path.slice(0, len);
      if (len === this.path.length) {
        other = PathChange.create(other.path.slice(len), other.change);
        self = this.change;
      } else {
        self = PathChange.create(this.path.slice(len), this.change);
        other = other.change;
      }

      const merged = self.merge(other, older);

      const s = PathChange.create(prefix, merged.self);
      const o = PathChange.create(prefix, merged.other);
      return { self: s, other: o };
    }

    visit(pathPrefix, visitor) {
      // TODO: use fake objects instead of arrays for perf
      this.change.visit(pathPrefix.concat(this.path), visitor);
    }
  };
}
