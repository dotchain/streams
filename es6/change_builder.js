"use strict";

export function buildChangeBuilder(types) {
  types.ChangeBuilder = class ChangeBuilder {
    constructor() {
      // TODO: this does not handle aggregating replaces at a sub path
      this.replaced = 0;
      this.changes = [];
    }

    result() {
      if (this.changes.length === 0) {
        return null;
      }

      if (this.changes.length == 1) {
        return this.changes[0];
      }

      throw new Error("NYI");
    }

    replace(pathPrefix, c) {
      if (c === null) return;
      c.visit(pathPrefix, {
        replace: (path, cx) => {
          if (path.length === 0) {
            if (this.replaced > 0) {
              this.changes.length = this.replaced;
              this.changes[this.replaced - 1].after = cx.after;
            } else {
              this.replaced = this.changes.push(cx);
            }
          } else {
            this.changes.push(new types.PathChange(path, cx));
          }
        }
      });
    }
  };
}
