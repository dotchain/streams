"use strict";

import { Replace } from "./replace.js";
import { Stream } from "./stream.js";

export function wrap(obj, stream) {
  stream = stream || new Stream();
  if (typeof obj == "string") {
    return new String(obj, stream);
  }

  if (obj instanceof String) {
    return obj.withStream(stream);
  }
}

export function unwrap(obj) {
  if (obj instanceof String) {
    return obj._value;
  }
  if (typeof obj == "string") {
    return obj;
  }
}

class StreamBase {
  constructor(value, stream) {
    this._value = value;
    this._stream = stream;
  }

  valueOf() {
    return this._value;
  }

  replace(v) {
    v = unwrap(v);
    let c = new Replace(this._value, v);
    let stream = this._stream.append(c);
    return wrap(c.apply(this._value), stream);
  }

  withStream(s) {
    return new String(this._value, s);
  }

  next() {
    let next = this._stream.next();
    let nextChange = this._stream.nextChange();
    if (next == null || nextChange == null) {
      return null;
    }
    return wrap(nextChange.apply(this._value), next);
  }

  latest() {
    let result = this;
    for (let next = result.next(); next != null; next = next.next()) {
      result = next;
    }
    return result;
  }
}

class String extends StreamBase {}
