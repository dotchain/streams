"use strict";

export function buildSnapFiles(types) {
  // SnapFiles is a file-based snapshot cache for use with Snapshot
  types.SnapFiles = class SnapFiles {
    constructor(datadir, fs, opts) {
      opts = opts || {};
      this._datadir = datadir;
      this._fs = fs;
      this._ver = -1;
      this._chunkSize = opts.chunkSize || 100;
      this._windowSize = opts.windowSize || 10;
      this._initValue = opts.initValuue || "";
      this._cache = {};
    }

    maxVersion() {
      return this._ver;
    }

    // get is the main function used by Snapshot
    async get(version, parentID, fetch) {
      if (version === -1 && !parentID) {
        return this._initValue;
      }

      const save =
        version > this._ver && !parentID && version % this._chunkSize === 0;
      this._ver = Math.max(this._ver, version);
      const key = parentID ? `${version}-${parentID}` : `${version}`;
      if (this._cache.hasOwnProperty(key)) {
        return this._cache[key];
      }

      const result = await this._readFileOrFetch(key, save, fetch);
      this._cache[key] = result;
      this._purge();
      return result;
    }

    async _readFileOrFetch(key, save, fetch) {
      const path = `${this._datadir}/snapshot-${key}.json`;
      try {
        return JSON.parse(await this._fs.promises.readFile(path, "utf8"));
      } catch (err) {
        if (err.code !== "ENOENT") {
          throw err;
        }
      }
      const data = await fetch();
      if (save) {
        await this._fs.promises.writeFile(path, JSON.stringify(data));
      }
      return data;
    }

    _purge() {
      for (let kk = 0; kk < this._ver - this._windowSize; kk++) {
        delete this._cache[kk];
      }
    }
  };
}
