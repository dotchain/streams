"use strict";

export class Stream {
  constructor() {
    this._next = null;
    this._nextChange = null;
  }

  append(c) {
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
