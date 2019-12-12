"use strict";

export function buildChildStream(types) {
  types.ChildStream = class ChildStream {
    constructor(parent, key) {
      this.parent = parent;
      this.key = key;
    }

    withRef(_r) {
      throw new Error("NYI");
    }

    ref() {
      return this.parent.ref().concat([this.key]);
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
      let abort = false;
      const filtered = new types.ChangeBuilder();
      c.visit([], {
        replace: (path, cx) => {
          if (path.length === 0) {
            abort = true;
          }
          if (!abort && path[0] === this.key) {
            filtered.replace(path.slice(1), cx);
          }
        }
      });
      return { filtered: filtered.result(), abort };
    }
  };
}
