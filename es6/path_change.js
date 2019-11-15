"use strict";

export function buildPathChange(types) {
  // PathChange represents a change at a path
  types.PathChange = class PathChange {
    constructor(path, change) {
      this.path = path;
      this.change = change;
    }

    apply(to) {
      if (this.path.length === 0) {
        return this.change ? this.change.apply(to) : to;
      }

      let rest = new PathChange(this.path.slice(1), this.change);
      let result = {};
      for (let key in to) {
        if (!to.hasOwnProperty(key) || key == this.path[0]) continue;
        result[key] = to[key];
      }
      result[this.path[0]] = rest.apply(to[this.path[0]] || {});
      return result;
    }

    merge(other, older) {
      return { self: this, other };
    }
  };
}
