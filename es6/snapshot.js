"use strict";

export function buildSnapshot(types) {
  const applyOp = (v, op) => (op.change ? op.change.apply(v) : v);

  types.Snapshot = class Snapshot {
    constructor(store, raw, xform, snaps) {
      this.raw = raw || new types.MemOpsCache();
      this.xform = xform || new types.MemOpsCache();
      this.store = types.transformStore(store, this.raw, this.xform);
      this.snaps = snaps;
    }

    async get(version, parentID) {
      return this.snaps.get(version, parentID, async () => {
        if (!parentID) {
          if (version === -1) {
            return "";
          }

          const snap = await this.get(version - 1);
          return applyOp(snap, (await this.store.fetch(version))[0]);
        }

        const pop = await this._getParentOp(parentID, version);
        if (!pop) {
          throw new Error("snapshot parentID not found");
        }

        let snap = await this.get(pop.basis, pop.parentID);
        snap = applyOp(snap, pop);
        const xform = (await this.xform.get(pop.version, 1))[0];
        for (let op of xform.merge) {
          if (op.version <= version) {
            snap = applyOp(snap, op);
          }
        }
        return snap;
      });
    }

    async _getParentOp(parentID, version) {
      let ops = await this.store.fetch(version);
      while (ops.length > 0) {
        for (let op of ops) {
          if (op.id === parentID) {
            return this.raw.get(op.version, 1)[0];
          }
        }
        version += ops.length;
        ops = await this.store.fetch(version);
      }
    }
  };
}
