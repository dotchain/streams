"use strict";

export function buildOperation(types) {
  types.Operation = class Operation {
    constructor(id, version, basis, parentID, change) {
      this.id = id;
      this.version = version;
      this.basis = basis;
      this.parentID = parentID;
      this.change = types.wrapChange(change);
    }

    withChange(c) {
      return new Operation(this.id, this.version, this.basis, this.parentID, c);
    }

    merge(others) {
      if (Array.isArray(others)) {
        let self = this;
        let results = [];
        for (let other of others) {
          let result = self.merge(other);
          self = result.self;
          results.push(result.other);
        }
        return { self, other: results };
      }

      if (this.change == null || others.change == null) {
        return { self: this, other: others };
      }
      let result = this.change.merge(others.change);
      let self = this.withChange(result.self);
      let other = others.withChange(result.other);
      return { self, other };
    }

    static wrap({ id, version, basis, parentID, change }) {
      return new Operation(id, version, basis, parentID, change);
    }

    toJSON() {
      return {
        id: this.id,
        version: this.version,
        basis: this.basis,
        parentID: this.parentID,
        change: this.change
      };
    }
  };
}
