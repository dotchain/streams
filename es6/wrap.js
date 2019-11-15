"use strict";

export function buildWrap(types) {
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
  types.wrap = function wrap(obj, stream) {
    stream = stream || new types.Stream();
    if (obj === null) {
      return new types.Null(obj, stream);
    }

    if (obj.withStream) {
      return obj.withStream(stream);
    }

    if (obj.nextChange) {
      return obj;
    }

    if (obj instanceof Date) {
      return new types.DateTime(obj, stream);
    }

    switch (typeof obj) {
      case "string":
        return new types.String(obj, stream);
      case "number":
        return new types.Number(obj, stream);
      case "boolean":
        return new types.Bool(obj, stream);
      case "object":
        if (obj.type === "date" && typeof obj.value === "number") {
          return new types.DateTime(new Date(obj.value), stream);
        }
        return new types.Dict(obj, stream);
    }

    return obj;
  };
}
