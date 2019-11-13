"use strict";

import { Replace } from "./replace.js";
import { Stream } from "./stream.js";
import { buildDict } from "./dict.js";

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
  if (obj === null) {
    return new Null(obj, stream);
  }

  if (obj instanceof StreamBase) {
    return obj.withStream(stream);
  }

  if (obj instanceof Date) {
    return new DateTime(obj, stream);
  }

  switch (typeof obj) {
    case "string":
      return new String(obj, stream);
    case "number":
      return new Number(obj, stream);
    case "boolean":
      return new Bool(obj, stream);
    case "object":
      if (obj.type === "date" && typeof obj.value === "number") {
        return new DateTime(new Date(obj.value), stream);
      }
      return new Dict(obj, stream);
  }

  return obj;
}

// unwrap is the inverse of wrap.
export function unwrap(obj) {
  if (obj instanceof StreamBase) {
    return obj.toJSON();
  }

  return obj;
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

  apply(c, older) {
    if (c == null) {
      return this;
    }

    let stream = this._stream.append(c, older);
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
    if (next === null) {
      return null;
    }
    if (nextChange === null) {
      return this.withStream(next);
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

// Number is the wrapped version of a number.
class Number extends StreamBase {}

// Bool is the wrapped version of a bool,
class Bool extends StreamBase {}

// DateTime is the wrapped version of a date.
class DateTime extends StreamBase {
  toJSON() {
    return { type: "date", value: this._value.valueOf() };
  }
}

const { Dict, Null } = buildDict({ wrap, StreamBase });
