"use struct";

export class MemCache {
  constructor() {
    this.version = -1;
    this.pending = [];
    this.merge = [];
    this.snapshot = "";
  }

  setPending(p) {
    this.pending = p;
  }

  setMerge(m) {
    this.merge = m;
  }

  setSnapshot(v) {
    this.snapshot = v;
  }

  setVersion(v) {
    this.version = v;
  }
}
