"use strict";

export function buildCache(types) {
  // Store implements a local-storage based cache
  types.Cache = class Cache {
    constructor(localStorage, prefix, initState) {
      this._ls = localStorage;
      this._init = JSON.stringify(initState || "");
      this._prefix = prefix || "";
    }

    get pending() {
      return JSON.parse(this._ls.getItem(this._prefix + "pending") || "[]");
    }

    setPending(p) {
      this._ls.setItem(this._prefix + "pending", JSON.stringify(p));
    }

    get merge() {
      return JSON.parse(this._ls.getItem(this._prefix + "merge") || "[]");
    }

    setMerge(p) {
      this._ls.setItem(this._prefix + "merge", JSON.stringify(p));
    }

    get snapshot() {
      return JSON.parse(
        this._ls.getItem(this._prefix + "snapshot") || this._init
      );
    }

    setSnapshot(p) {
      this._ls.setItem(this._prefix + "snapshot", JSON.stringify(p));
    }

    get version() {
      return JSON.parse(this._ls.getItem(this._prefix + "version") || "-1");
    }

    setVersion(p) {
      this._ls.setItem(this._prefix + "version", JSON.stringify(p));
    }
  };
}
