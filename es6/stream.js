"use strict";

// Stream implements a change stream.
//
// A stream effectively holds a reference to the next version (and
// therefore all future versions).
//
// Mutations are applied to a stream via the append() method.
//
// When a mutation is applied to an instance that already has a *next*
// version, the current mutation is transformed against all the *next*
// changes before getting tacked on to the end.  In addition, all the
// *next* changes are transformed against the current version to form
// an alternate future where the current change is applied first.
// Both these futures are guaranteed to end in the same place due to
// thee magic of OT.
export class Stream {
  constructor() {
    this._next = null;
    this._nextChange = null;
  }

  append(c, older) {
    this._nextChange = c;
    this._next = new Stream();
    return this._next;
  }

  next() {
    return this._next;
  }

  nextChange() {
    return this._nextChange;
  }
}
