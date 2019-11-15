"use strict";

export function buildSync(types) {
  types.sync = function sync(cache, transport, newID) {
    let snap = cache.snapshot;
    let version = cache.version;
    let pending = cache.pending.map(types.Operation.wrap);
    let merge = cache.merge.map(types.Operation.wrap);
    let local = types.wrap(snap);

    function push() {
      for (let next = local.next(); next != null; next = next.next()) {
        let parentID =
          pending.length > 0 ? pending[pending.length - 1].id : null;
        let op = new types.Operation(
          newID(),
          -1,
          version,
          parentID,
          local.nextChange()
        );
        transport.write(op);
        pending.push(op);
        merge.push(op);
        cache.setPending(pending);
        cache.setMerge(merge);
        local = next;
        cache.setSnapshot(local.toJSON());
      }
    }

    function pull(op) {
      op = types.Operation.wrap(op);
      if (pending.length > 0 && pending[0].id == op.id) {
        pending.shift();
        cache.setPending(pending);
        merge.shift();
        cache.setMerge(merge);
      } else {
        let { self, other } = op.merge(merge);
        op = self;
        merge = other;
        cache.setMerge(merge);
        local = local.apply(op.change, true);
      }
      version = op.version;
      cache.setVersion(version);
      cache.setSnapshot(local.toJSON());
    }

    transport.start(version, pending, push, pull);
    return local;
  };
}
