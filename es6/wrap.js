"use strict";

import { Replace } from "./replace.js";
import { Stream } from "./stream.js";

// wrap wraps an object (an an optional stream) to return a stream
// based proxy of this object.
//
// The return value mostly looks like the input object but has a few
// extra methods:
//
// The replace() method replaces the value in the underlying stream.
//
// The next() returns the next value in this stream while latest()
// returns the latest value in this stream.
export function wrap(obj, stream) {
  stream = stream || new Stream();
  if (typeof obj == "string") {
    return new String(obj, stream);
  }

  if (obj instanceof StreamBase) {
    return obj.withStream(stream);
  }
}

// unwrap is the inverse of wrap.
export function unwrap(obj) {
  if (obj instanceof StreamBase) {
    return obj._value;
  }

  if (typeof obj == "string") {
    return obj;
  }
}

// StreamBase is the base stream object used by most types.
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
    return this.apply(new Replace(this._value, unwrap(v)));
  }

  apply(c) {
    if (c == null) {
      return this;
    }

    let stream = this._stream.append(c);
    return wrap(c.apply(this._value), stream);
  }

  applyRemote(c) {
    if (c == null) {
      return this;
    }

    let stream = this._stream.appendRemote(c);
    return wrap(c.apply(this._value), stream);
  }

  withStream(s) {
    return new String(this._value, s);
  }

  nextChange() {
    return this._stream.nextChange();
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

// String is the wrapped version of a string.
class String extends StreamBase {}
