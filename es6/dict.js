"use strict";

import { PathChange } from "./path_change.js";
import { Replace } from "./replace.js";

export function buildDict({ wrap, StreamBase }) {
  class ChildStream {
    constructor(parent, key) {
      this.parent = parent;
      this.key = key;
    }

    append(c, older) {
      let parent = this.parent.append(new PathChange([this.key], c), older);
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
      if (!(c instanceof PathChange)) {
        return { filtered: null, abort: true };
      }
      if (c.path.length == 0) return this._filter(c.change);
      let abort = false;
      let filtered = c.path[0] === this.key ? c.change : null;
      return { filtered, abort };
    }
  }

  return class Dict extends StreamBase {
    constructor(obj, stream) {
      super(obj, stream);
      let getter = key => () => wrap(obj[key], new ChildStream(stream, key));
      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          Object.defineProperty(this, key, { get: getter(key) });
        }
      }
    }

    replacePath(path, value) {
      let before = this.toJSON();
      for (let key of path) {
        if (before && before.hasOwnProperty(key)) {
          before = before[key];
        } else {
          before = null;
        }
      }
      return this.apply(new PathChange(path, new Replace(before, value)));
    }
  };
}
