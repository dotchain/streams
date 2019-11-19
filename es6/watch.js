"use strict";

export function buildWatch(types) {
  types.watch = function object(s, fn) {
    s = types.wrap(s);
    const result = types.wrap(fn(s));
    return types.wrap(result.toJSON(), new WatchStream(s, fn, result));
  };

  class WatchStream {
    constructor(s, fn, result) {
      this.s = s;
      this.fn = fn;
      this.result = result;
      this._next = null;
    }

    append(_c, _older) {
      return new Error("NYI");
    }

    next() {
      this.nextChange();
      if (this._next !== null) {
        return this._next.next;
      }
      return null;
    }

    nextChange() {
      if (this._next !== null) {
        return this._next.change;
      }

      const snext = this.s.next();
      if (snext !== null) {
        const resultNext = types.wrap(this.fn(snext));
        this._next = {
          next: new WatchStream(snext, this.fn, resultNext),
          change: new types.Replace(this.result, resultNext)
        };
        return this._next.change;
      }

      const resultNext = this.result.next();
      if (resultNext !== null) {
        this._next = {
          next: new WatchStream(this.s, this.fn, resultNext),
          change: this.result.nextChange()
        };
        return this._next.change;
      }

      return null;
    }
  }
}
