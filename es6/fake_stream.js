"use strict";

export function buildFakeStream(types) {
  types.FakeStream = class FakeStream {
    constructor(props) {
      this._props = props || { next: this };
    }

    append(_c, _older) {
      return this;
    }

    next() {
      return this._props.next || null;
    }

    nextChange() {
      return this._props.nextChange || null;
    }
  };
}
