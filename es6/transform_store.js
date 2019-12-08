"use strict";

export function buildTransformStore(types) {
  // transformStore converts an raw ops store into one that has
  // transformed ops.  The raw and xform args are caches used for
  // peformance (both are write-once key-value stores).
  types.transformStore = function transformStore(store, raw, xform) {
    return new TransformedStore(store, raw, xform);
  };

  types.MemOpsCache = class MemOpsCache {
    get(version, count) {
      const ops = [];
      for (let kk = 0; kk < count && this[version + kk]; kk++) {
        ops.push(this[version + kk]);
      }
      return ops;
    }
    set(version, ops) {
      for (let kk = 0; kk < ops.length; kk++) {
        this[version + kk] = ops[kk];
      }
    }
  };

  // maxOps is the max number of ops fetched in a single shot
  const maxOps = 1000;
  class TransformedStore {
    constructor(store, raw, xform) {
      this.store = store;
      this.raw = raw || new types.MemOpsCache();
      this.xform = xform || new types.MemOpsCache();
    }

    write(ops) {
      return this.store.write(ops); // write is transparent
    }

    async fetch(version) {
      try {
        return await this._fetch(version, maxOps);
      } catch (err) {
        console.log("********* Got err *******", err);
        throw err;
      }
    }

    async _fetch(version, count) {
      const ops = this.raw.get(version, count);
      const diff = count - ops.length;
      if (diff > 0) {
        const raw = await this.store.fetch(version + ops.length, diff);
        this.raw.set(version + ops.length, raw);
        for (let op of raw) {
          ops.push((await this._transformAndCache(op)).xform);
        }
      }
      return ops;
    }

    async _transformAndCache(op) {
      let xform = this.xform.get(op.version, 1)[0];
      if (!xform) {
        xform = await this._transform(op);
        this.xform.set(op.version, [xform]);
      }
      return xform;
    }

    async _transform(op) {
      const gap = op.version - op.basis - 1;
      if (gap === 0) {
        // no interleaved op, so no special transformation needed.
        return { xform: op, merge: [] };
      }

      // fetch all ops since basis
      let ops = [];
      for (let diff = gap - ops.length; diff > 0; diff = gap - ops.length) {
        const more = await this._fetch(op.basis + 1 + ops.length, diff);
        ops = ops.concat(more);
      }
      ops = ops.slice(0, gap);

      let result = { xform: op, merge: [] };
      if (op.parentID) {
        // skip all those before the parent if current op has parent
        let idx = 0;
        for (; ops[idx].id !== op.parentID; idx++);

        // The current op is meant to be applied on top of the parent op.
        // The parent op has a merge chain which corresponds to the set of
        // operation were accepted by the server before the parent operation
        // but which were not known to the parent op.
        //
        // The current op may have factored in a few but those in the
        // merge chain that were not factored would contribute to its own
        // merge chain.
        result = await this._getMergeChain(op, ops[idx]);
        ops = ops.slice(idx + 1);
      }

      // The transformed op needs to be merged against all ops that were
      // accepted by the server between the parent and the current op.
      for (let kk = 0; kk < ops.length; kk++) {
        const x = await this._transformAndCache(ops[kk]);
        const merged = x.xform.merge(result.xform);
        result.xform = merged;
        result.merge.push(merged.self);
      }

      return result;
    }

    // getMergeChain gets all operations in the merge chain of the parent
    // that hove not been factored into the current op.  The provided op
    // is transformed against this merge chain to form its own initial
    // merge chain.
    async _getMergeChain(op, parent) {
      let result = { xform: op, merge: [] };
      const ops = (await this._transformAndCache(parent)).merge;

      for (let kk = 0; kk < ops.length; kk++) {
        if (ops[kk].version <= op.basis) continue;
        const merged = ops[kk].merge(result.xform);
        result.xform = merged.other;
        result.merge.push(merged.self);
      }

      return result;
    }
  }
}
