"use strict";

export function buildBasicTypes(types) {
  class StreamBase {
    constructor(value, stream) {
      this._value = value;
      this._stream = stream;
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

      const r = new types.Replace(before, value);
      return this.apply(types.PathChange.create(path, r));
    }

    apply(c, older) {
      if (c == null) {
        return this;
      }

      let stream = this._stream.append(c, older);
      return types.wrap(c.apply(this._value), stream);
    }

    withStream(s) {
      return new this.constructor(this._value, s);
    }

    withRef(r) {
      return new this.constructor(this._value, this._stream.withRef(r));
    }

    ref(subPath) {
      return this._stream.ref(subPath);
    }

    nextChange() {
      return this._stream.nextChange();
    }

    next() {
      let next = this._stream.next();
      let nextChange = this._stream.nextChange();
      if (next === null) {
        return null;
      }
      if (nextChange === null) {
        return this.withStream(next);
      }
      return types.wrap(nextChange.apply(this._value), next);
    }

    latest() {
      let result = this;
      for (let next = result.next(); next != null; next = next.next()) {
        result = next;
      }
      return result;
    }
  }

  // String is the wrapped version of a string.
  types.String = class String extends StreamBase {};

  // Number is the wrapped version of a number.
  types.Number = class Number extends StreamBase {};

  // Bool is the wrapped version of a bool,
  types.Bool = class Bool extends StreamBase {};

  // DateTime is the wrapped version of a date.
  types.DateTime = class DateTime extends StreamBase {
    toJSON() {
      return { type: "date", value: this._value.valueOf() };
    }
  };

  // Null is the wrapped version of null
  types.Null = class Null extends StreamBase {
    get(key) {
      return new Null(null, new types.ChildStream(this._stream, key));
    }
  };

  // Dict is the wrapped version of a hash/map
  types.Dict = class Dict extends StreamBase {
    constructor(obj, stream) {
      super(obj, stream);
      let getter = key => () => this.get(key);
      for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
          Object.defineProperty(this, key, { get: getter(key) });
        }
      }
    }

    get(key) {
      let obj = this.toJSON();
      let v = obj && obj.hasOwnProperty(key) ? obj[key] : null;
      return types.wrap(v, new types.ChildStream(this._stream, key));
    }

    exists(key) {
      return this.toJSON().hasOwnProperty(key);
    }

    forEachKey(fn) {
      let obj = this.toJSON();
      for (let key in obj) {
        const result = obj.hasOwnProperty(key) && fn(key);
        if (result) return result;
      }
    }
  };
}
