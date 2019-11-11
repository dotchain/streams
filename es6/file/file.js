"use strict";

import fs from "fs";

// FileStore is a file-based store
export class FileStore {
  constructor(filepath) {
    this._filepath = filepath;
    this._lock = new LockedFile();
  }

  fetch(version) {
    return this._lock.using(this._filepath, ops => ops.slice(version));
  }

  write(writeOps) {
    return this._lock.using(this._filepath, ops => {
      for (let op of writeOps) {
        if (!this._exists(ops, op.id)) {
          op.version = ops.length;
          ops.push(op);
        }
      }
      return {};
    });
  }

  _exists(ops, id) {
    for (let op of ops) {
      if (op.id == id) {
        return true;
      }
    }
    return false;
  }
}

// LockedFile serializes access to the file
class LockedFile {
  constructor() {
    this.q = [];
  }

  using(filepath, cb) {
    return new Promise((resolve, reject) => {
      this.q.push(next => {
        try {
          resolve(this._withFile(filepath, cb));
        } catch (err) {
          reject(err);
        } finally {
          next();
        }
      });

      if (this.q.length == 1) {
        this._process();
      }
    });
  }

  async _process() {
    while (this.q.length > 0) {
      await new Promise(resolve => this.q[0](resolve));
      this.q.shift();
    }
  }

  _withFile(filepath, cb) {
    let ops = [];
    try {
      ops = JSON.parse(fs.readFileSync(filepath, "utf8"));
    } catch (err) {
      if (err.code !== "ENOENT") {
        throw err;
      }
    }

    return this._withContents(filepath, ops, cb);
  }

  _withContents(filepath, ops, cb) {
    let before = ops.length;
    let result = cb(ops);
    if (ops.length !== before) {
      fs.writeFileSync(filepath, JSON.stringify(ops));
    }
    return result;
  }
}
