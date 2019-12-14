"use strict";

export function buildOrder(types) {
  types.order = (s, fn) => {
    return new OrderBy(types.wrap(s), fn);
  };

  types.orderBy = (s, fn) => {
    return new OrderBy(types.wrap(s), comparer(fn));
  };

  const create = (o, val) => new OrderBy(val, o.fn, o._sortedKeys);

  class OrderBy {
    constructor(v, compareFn, sortedKeys) {
      this.v = v;
      this.fn = compareFn;
      this._sortedKeys = sortedKeys || null;
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
      return create(this, this.v.withStream(s));
    }

    withRef(r) {
      return create(this, this.v.withRef(r));
    }

    ref(subPath) {
      return this.v.ref(subPath);
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
        this._sortedKeys.sort((x, y) => this.fn(this.v[x], this.v[y], x, y));
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
    return (xVal, yVal, xKey, yKey) => {
      const x = valueOf(fn(xVal, xKey));
      const y = valueOf(fn(yVal, yKey));

      if (x === y) return 0;
      if (typeof x === "undefined") return 1;
      if (typeof y === "undefined") return -1;

      const sx = typeof x === "object" ? JSON.stringify(x) : x;
      const sy = typeof y === "object" ? JSON.stringify(y) : y;
      return sx === sy ? 0 : sx < sy ? -1 : 1;
    };
  }
}
