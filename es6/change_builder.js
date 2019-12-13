"use strict";

export function buildChangeBuilder(types) {
  types.ChangeBuilder = class ChangeBuilder {
    constructor() {
      // TODO: this does not handle aggregating replaces at a sub path
      this.replaced = 0;
      this.changes = [];
    }

    result() {
      return types.Changes.create(this.changes);
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
            this.changes.push(types.PathChange.create(path, cx));
          }
        }
      });
    }
  };
}
