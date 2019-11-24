"use strict";

export function buildObject(types) {
  types.object = function object(o) {
    return new Obj(o);
  };

  class Obj {
    constructor(o) {
      this._value = o;
      this._cached = {};
      const getter = key => () => this.get(key);
      for (let key in o) {
        if (o.hasOwnProperty(key)) {
          Object.defineProperty(this, key, { get: getter(key) });
        }
      }
    }

    valueOf() {
      return this._value;
    }

    toJSON() {
      return this._value;
    }

    replace(v) {
      return this.apply(new types.Replace(this, v), false);
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
      return this.apply(
        new types.PathChange(path, new types.Replace(before, value))
      );
    }

    apply(c, older) {
      if (c === null) return this;

      let obj = null;
      c.visit([], {
        replace: (path, cx) => {
          obj = obj || Object.assign({}, this._value);
          cx = new types.PathChange(path.slice(1), cx);
          obj[path[0]] = obj[path[0]].apply(cx, older);
        }
      });
      return obj ? new Obj(obj) : this;
    }

    get(key) {
      if (!this._cached.hasOwnProperty(key)) {
        let obj = this._value;
        let v = obj && obj.hasOwnProperty(key) ? obj[key] : null;
        this._cached[key] = types.wrap(v);
      }
      return this._cached[key];
    }

    exists(key) {
      return this._value && this._value.hasOwnProperty(key);
    }

    forEachKey(fn) {
      let obj = this._value;
      for (let key in obj) {
        const result = obj.hasOwnProperty(key) && fn(key);
        if (result) return result;
      }
    }

    nextChange() {
      let c = null;
      this.forEachKey(key => {
        const next = this.get(key).next();
        const cx = this.get(key).nextChange();
        if (!next) return;

        if (cx === null) {
          this.cached[key] = next;
        } else {
          c = new types.PathChange([key], cx);
          return true;
        }
      });
      return c;
    }

    next() {
      const c = this.nextChange();
      if (c === null) return null;
      const changed = {};
      this.forEachKey(key => {
        changed[key] = this.get(key);
      });
      changed[c.path[0]] = this.get(c.path[0]).next();
      return new Obj(changed);
    }

    latest() {
      let result = this;
      for (let next = result.next(); next != null; next = next.next()) {
        result = next;
      }
      return result;
    }
  }
}
