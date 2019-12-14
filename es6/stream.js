"use strict";

export function buildStream(types) {
  const merge = (self, other, older) => {
    if (self === null || other === null) return { self, other };
    return self.merge(other, older);
  };

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
  types.Stream = class Stream {
    constructor() {
      this._next = null;
      this._nextChange = null;
      this._ref = [];
    }

    ref(subPath) {
      return this._ref.concat(subPath || []);
    }

    withRef(r) {
      const result = new Stream();
      result._next = this._next;
      result._nextChange = this._nextChange;
      result._ref = r;
      return result;
    }

    append(c, older) {
      const result = new Stream();
      result._ref = this._ref;
      let tail = this;
      let next = result;
      let tailnext = tail.next();
      while (tailnext !== null) {
        const merged = merge(tail.nextChange(), c, older);
        next = next.append(merged.self, older);
        c = merged.other;
        tail = tailnext;
        tailnext = tail.next();
      }
      tail._nextChange = c;
      tail._next = next;
      return result;
    }

    next() {
      return this._next;
    }

    nextChange() {
      return this._nextChange;
    }
  };
}
