"use strict";

export function buildMap(types) {
  types.map = function map(s, fn) {
    return new Map(types.wrap(s), fn);
  }

  class Map {
    constructor(s, fn) {
      this.s = s;
      this.fn = fn;
      this._value = null;
      this.s.forEachKey(key => {
        Object.defineProperty(this, key, {get: () => this.get(key)});
      });
    }

    valueOf() {
      if (this._value !== null) return this._value;
      this._value = {};
      this.s.forEachKey(key => {
        this._value[key] = this.fn(this.s.get(key));
      });
      return this._value;
    }

    toJSON() {
      return this.valueOf();
    }

    get(key) {
      if (this._value && this._value.hasOwnProperty(key)) return this._value[key];
      return this.fn(this.s.get(key));
    }

    exists(key) {
      return this.s.exists(key);
    }

    forEachKey(fn) {
      return this.s.forEachKey(fn);
    }

    next() {
      const snext = this.s.next();
      return snext ? new Map(snext, this.fn) : null;
    }

    nextChange() {
      const c = this.s.nextChange();
      if (c === null) return null;

      const modified = {};
      c.visit([], {
        replace: (path, c) => { modified[path[0]] = true }
      });

      const next = this.next();
      const builder = new types.ChangeBuilder();
      for (let key in modified) {
        const before = this.get(key).toJSON();
        const after = next.get(key).toJSON();
        builder.replace([key], new types.Replace(before, after));
      }
      return builder.result();
    }
  }
}
