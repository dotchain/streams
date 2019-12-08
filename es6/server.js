"use strict";

export function buildServer(types) {
  // serve handles request using the provided store
  types.serve = function serve(store, req, res) {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", chunk => {
      body += chunk;
    });
    req.on("end", async () => {
      const wrap = x => types.Operation.wrap(x);
      try {
        const data = JSON.parse(body);
        let result = "";
        if (data.read) {
          result = await store.fetch(data.read.from);
        } else {
          result = await store.write(data.write.map(wrap));
        }
        res.write(JSON.stringify(result));
        res.end();
      } catch (err) {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: err }));
      }
    });
  };

  // MemStore is in-memory store
  types.MemStore = class MemStore {
    constructor() {
      this.ops = [];
    }

    async fetch(version) {
      return this.ops.slice(version);
    }

    async write(ops) {
      for (let op of ops) {
        if (!this._exists(op.id)) {
          op.version = this.ops.length;
          this.ops.push(op);
        }
      }
      return {};
    }

    _exists(id) {
      for (let op of this.ops) {
        if (op.id == id) {
          return true;
        }
      }
      return false;
    }
  };
}
