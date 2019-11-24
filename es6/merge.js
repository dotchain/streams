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

    append(c, older) {
      let streams = null;
      if (c) {
        c.visit([], {
          replace: (path, cx) => {
            let idx = this._findStreamIndex(streams || this.streams, path[0]);
            if (idx == -1) idx = this.streams.length - 1;

            streams = streams || this.streams.slice();
            cx = new types.PathChange(path, cx);
            streams[idx] = streams[idx].apply(cx, older);
          }
        });
      }
      return streams ? new MergeStream(streams) : this;
    }

    exists(key) {
      for (let stream of this.streams) {
        if (stream.exists && stream.exists(key)) {
          return true;
        }
      }
      return false;
    }

    get(key) {
      if (this.exists(key)) return this[key];
      return new types.Null(null, new types.ChildStream(this, key));
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
        if (abort) continue;
        if (c) return c;
        let next = stream.next();
        if (next) {
          this.streams[kk] = next;
        }
      }
      return null;
    }

    _findStreamIndex(streams, key) {
      for (let jj = streams.length - 1; jj >= 0; jj--) {
        if (this.streams[jj].exists(key)) return jj;
      }
      return -1;
    }

    _filter(kk, c) {
      if (c === null) {
        return { c, abort: false };
      }
      let builder = new types.ChangeBuilder();
      let abort = false;
      c.visit([], {
        replace: (path, cx) => {
          if (abort) return;
          const rest =
            path.length > 1 ? new types.PathChange(path.slice(1), cx) : cx;
          let result = this._filterKey(kk, path[0], rest);
          abort = abort || result.abort;
          builder.replace([path[0]], result.c);
        }
      });

      return { c: abort ? null : builder.result(), abort };
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

      const idx = this._findStreamIndex(this.streams.slice(0, kk), key);
      if (idx != -1) {
        // TODO: need to modify c so that its before or after = old value
        throw new Error("NYI");
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
