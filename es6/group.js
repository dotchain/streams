"use strict";

export function buildGroup(types) {
  types.groupBy = (s, fn) => {
    const stream = new GroupStream(s, fn, group(s, fn));
    return types.wrap(stream.groups, stream);
  };

  function group(v, fn) {
    const result = {};
    v = (v && v.valueOf()) || {};
    for (let key in v) {
      if (!v.hasOwnProperty(key)) continue;
      const gkey = fn(v[key], key);
      result[gkey] = result[gkey] || {};
      result[gkey][key] = v[key];
    }
    return result;
  }

  function ungroup(v) {
    const result = {};
    v = (v && v.valueOf()) || {};
    for (let gkey in v) {
      const vx = (v[gkey] && v[gkey].valueOf()) || {};
      for (let key in vx) {
        if (vx.hasOwnProperty(key)) {
          result[key] = vx[key];
        }
      }
    }
    return result;
  }

  class GroupStream {
    constructor(s, fn, groups) {
      this.s = s;
      this.fn = fn;
      this.groups = groups;
      this._ref = [];
    }

    ref() {
      return this._ref;
    }

    withRef(r) {
      const result = new GroupStream(this.s, this.fn, this.groups);
      result._ref = r;
      return result;
    }

    append(c, older) {
      if (c === null) return this;

      // TODO: handle case when last elt of group is deleted
      // (the whole group should also be deleted)
      const changes = new types.ChangeBuilder();
      c.visit([], {
        replace: (path, cx) => {
          if (path.length == 0) {
            const r = new types.Replace(ungroup(cx.before), ungroup(cx.after));
            changes.replace([], r);
          } else if (path.length === 1) {
            for (let key in cx.before || {}) {
              changes.replace([key], new types.Replace(cx.before[key], null));
            }
            for (let key in cx.after || {}) {
              changes.replace([key], new types.Replace(null, cx.after[key]));
            }
          } else {
            changes.replace(path.slice(1), cx);
          }
        }
      });

      const s = this.s.apply(changes.result(), older);
      return new GroupStream(s, this.fn, group(s, this.fn));
    }

    next() {
      const n = this.s.next();
      return n === null ? n : new GroupStream(n, this.fn, group(n, this.fn));
    }

    nextChange() {
      const c = this.s.nextChange();
      if (c === null) return null;

      const changes = new types.ChangeBuilder();
      let current = this.s.valueOf();
      let keycounts = counts(this.groups);

      c.visit([], {
        replace: (path, cx) => {
          const updated = new types.PathChange(path, cx).apply(current);
          if (path.length === 0) {
            const g = group(cx.after, this.fn);
            const r = new types.Replace(group(cx.before, this.fn), g);
            changes.replace([], r);
            keycounts = counts(g);
          } else {
            const key = path[0];
            const existed = current && current.hasOwnProperty(key);
            const exists = updated && updated.hasOwnProperty(key);
            const beforeGroup = existed && this.fn(current[key], key);
            const afterGroup = exists && this.fn(updated[key], key);
            const changed = "" + beforeGroup !== "" + afterGroup;
            if (existed && (!exists || changed)) {
              keycounts[beforeGroup]--;
              const r = new types.Replace(current[key], null);
              changes.replace(["" + beforeGroup, key], r);
              if (keycounts[beforeGroup] === 0) {
                const rx = new types.Replace({}, null);
                changes.replace(["" + beforeGroup], rx);
              }
            }
            if (exists && (!existed || changed)) {
              const r = new types.Replace(null, updated[key]);
              changes.replace(["" + afterGroup, key], r);
              keycounts[afterGroup] = (keycounts[afterGroup] || 0) + 1;
            }

            if (existed && exists && !changed) {
              changes.replace(["" + beforeGroup].concat(path), cx);
            }
          }
          current = updated;
        }
      });
      return changes.result();
    }
  }

  function counts(g) {
    const result = {};
    for (let key in g) {
      if (g.hasOwnProperty(key)) {
        for (let gkey in g[key]) {
          if (g[key].hasOwnProperty(gkey)) {
            result[key] = 1 + (result[key] || 0);
          }
        }
      }
    }
    return result;
  }
}
