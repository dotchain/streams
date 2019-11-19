"use strict";

export function buildMerge(types) {
  class MergeStream {
    constructor(streams) {
      this.streams = streams;
      for (let stream of streams) {
        stream.forEachKey && this._setupStream(stream);
      }
    }

    _setupStream(stream) {
      stream.forEachKey(key => {
        let get = () => stream[key];
        Object.defineProperty(this, key, { get });
      });
    }

    forEachKey(_fn) {
      throw new Error("NYI");
    }

    append(_c, _older) {
      throw new Error("NYI");
    }

    exists(key) {
      for (let stream of this.streams) {
        if (stream.exists && stream.exists(key)) {
          return true;
        }
      }
      return false;
    }

    next() {
      for (let kk = 0; kk < this.streams.length; kk++) {
        let stream = this.streams[kk];
        let { c, abort } = this._filter(kk, stream.nextChange());
        if (abort) return null;
        if (c) {
          let result = this.streams.slice();
          result[kk] = stream.next();
          return new MergeStream(result);
        }
        let next = stream.next();
        if (next) {
          this.streams[kk] = next;
        }
      }
      return null;
    }

    nextChange() {
      for (let kk = 0; kk < this.streams.length; kk++) {
        let stream = this.streams[kk];
        let { c, abort } = this._filter(kk, stream.nextChange());
        if (c || abort) return c;
        let next = stream.next();
        if (next) {
          this.streams[kk] = next;
        }
      }
      return null;
    }

    _filter(kk, c) {
      if (c === null) {
        return { c, abort: false };
      }
      if (!(c instanceof types.PathChange)) {
        throw new Error("NYI"); // TODO: handle object completely changing
      }
      if (c.path.length === 0) {
        return this._filter(kk, c.change);
      }
      return this._filterKey(
        kk,
        c.path[0],
        new types.PathChange(c.path.slice(1), c.change)
      );
    }

    _filterKey(kk, key, c) {
      let abort = false;
      for (let jj = kk + 1; jj < this.streams.length; jj++) {
        if (this.streams[jj].exists(key)) return { c: null, abort };
      }
      const existed = this.streams[kk].exists(key);
      const willExist = this.streams[kk].next().exists(key);
      if (existed && willExist) {
        return { c, abort };
      }

      for (let jj = kk - 1; jj >= 0; jj--) {
        if (this.streams[kk].exists(key)) {
          // TODO: need to modify c so that its before or after = old value
          throw new Error("NYI");
        }
      }
      return { c, abort };
    }

    latest() {
      let result = this;
      for (let next = result.next(); next != null; next = next.next()) {
        result = next;
      }
      return result;
    }
  }

  types.merge = function merge(objs) {
    let wrapNonStream = x => (x.nextChange ? x : types.wrap(x));
    return new MergeStream(objs.map(wrapNonStream));
  };
}
