"use strict";

export function buildChildStream(types) {
  types.ChildStream = class ChildStream {
    constructor(parent, key) {
      this.parent = parent;
      this.key = key;
    }

    append(c, older) {
      let parent = this.parent.append(
        new types.PathChange([this.key], c),
        older
      );
      return new ChildStream(parent, this.key);
    }

    next() {
      let c = this.nextChange();
      if (c) {
        return new ChildStream(this.parent.next(), this.key);
      }
      return null;
    }

    nextChange() {
      for (let c = this.parent.nextChange(); c; c = this.parent.nextChange()) {
        let { filtered, abort } = this._filter(c);
        if (filtered != null || abort) return filtered;
        this.parent = this.parent.next();
      }
      return null;
    }

    _filter(c) {
      if (!(c instanceof types.PathChange)) {
        return { filtered: null, abort: true };
      }
      if (c.path.length == 0) return this._filter(c.change);
      let abort = false;
      let filtered = c.path[0] === this.key ? c.change : null;
      return { filtered, abort };
    }
  };
}
