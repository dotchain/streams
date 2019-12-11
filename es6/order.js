"use strict";

export function buildOrder(types) {
  types.order = (s, fn) => {
    return new OrderBy(types.wrap(s), fn);
  };

  types.orderBy = (s, fn) => {
    return new OrderBy(types.wrap(s), comparer(fn));
  };

  class OrderBy {
    constructor(v, compareFn) {
      this.v = v;
      this.fn = compareFn;
      this._sortedKeys = null;
      v.forEachKey(key => {
        Object.defineProperty(this, key, { get: () => this.get(key) });
      });
    }

    valueOf() {
      return this.v.valueOf();
    }

    toJSON() {
      return this.v.toJSON();
    }

    withStream(s) {
      return new OrderBy(this.v.withStream(s), this.fn);
    }

    withRef(r) {
      return new OrderBy(this.v.withRef(r), this.fn);
    }

    ref() {
      return this.v.ref();
    }

    next() {
      const n = this.v.next();
      return n && new OrderBy(n, this.fn);
    }

    nextChange() {
      return this.v.nextChange();
    }

    replace(v) {
      return new OrderBy(this.v.replace(v), this.fn);
    }

    replacePath(path, v) {
      return new OrderBy(this.v.replacePath(path, v), this.fn);
    }

    apply(c, older) {
      return new OrderBy(this.v.apply(c, older), this.fn);
    }

    latest() {
      const v = this.v.latest();
      return v === this.v ? this : new OrderBy(v, this.fn);
    }

    get(key) {
      return this.v.get(key);
    }

    exists(key) {
      return this.v.exists(key);
    }

    forEachKey(fn) {
      if (!this._sortedKeys) {
        this._sortedKeys = [];
        this.v.forEachKey(key => {
          this._sortedKeys.push(key);
        });
        this._sortedKeys.sort((x, y) => this.fn(this.v, x, y));
      }
      for (let key of this._sortedKeys) {
        const result = fn(key);
        if (result) return result;
      }
    }
  }

  function comparer(fn) {
    const valueOf = x => x && x.valueOf();

    // fn returns a value that must be used for comparisons.
    return (list, xKey, yKey) => {
      const x = valueOf(fn(list, xKey));
      const y = valueOf(fn(list, yKey));

      console.log("comparing", list, xKey, yKey, x, y);

      if (x === y) return 0;
      if (typeof x === "undefined") return 1;
      if (typeof y === "undefined") return -1;

      const sx = typeof x === "object" ? JSON.stringify(x) : x;
      const sy = typeof y === "object" ? JSON.stringify(y) : y;
      return sx === sy ? 0 : sx < sy ? -1 : 1;
    };
  }
}
