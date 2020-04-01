"use strict";

import { buildBasicTypes } from "./basic_types.js";
import { buildStream } from "./stream.js";
import { buildChildStream } from "./child_stream.js";
import { buildMerge } from "./merge.js";
import { buildObject } from "./object.js";
import { buildWatch } from "./watch.js";
import { buildMap } from "./map.js";
import { buildOrder } from "./order.js";
import { buildGroup } from "./group.js";
import { buildFilter } from "./filter.js";
import { buildOperation } from "./op.js";
import { buildPathChange } from "./path_change.js";
import { buildReplace } from "./replace.js";
import { buildChanges } from "./changes.js";
import { buildChangeBuilder } from "./change_builder.js";
import { buildSync } from "./sync.js";
import { buildTransport } from "./transport.js";
import { buildSnapshot } from "./snapshot.js";
import { buildWrap } from "./wrap.js";
import { buildServer } from "./server.js";
import { buildFileStore } from "./filestore_node.js";
import { buildCache } from "./cache_browser.js";
import { buildTransformStore } from "./transform_store.js";
import { buildSnapFiles } from "./snapfiles_node.js";

function build() {
  let types = {};
  buildBasicTypes(types);
  buildStream(types);
  buildChildStream(types);
  buildMerge(types);
  buildObject(types);
  buildWatch(types);
  buildMap(types);
  buildOrder(types);
  buildGroup(types);
  buildFilter(types);
  buildOperation(types);
  buildPathChange(types);
  buildReplace(types);
  buildChanges(types);
  buildChangeBuilder(types);
  buildSync(types);
  buildTransport(types);
  buildSnapshot(types);
  buildWrap(types);
  buildCache(types);

  buildTransformStore(types);
  buildServer(types);
  buildFileStore(types);
  buildSnapFiles(types);
  return types;
}

const types = build();
const wrap = types.wrap;
const sync = types.sync;
const urlTransport = types.urlTransport;
const serve = types.serve;
const merge = types.merge;
const object = types.object;
const watch = types.watch;
const map = types.map;
const order = types.order;
const orderBy = types.orderBy;
const groupBy = types.groupBy;
const filter = types.filter;
const Replace = types.Replace;
const Changes = types.Changes;
const PathChange = types.PathChange;
const ChangeBuilder = types.ChangeBuilder;
const Transport = types.Transport;
const Snapshot = types.Snapshot;
const MemStore = types.MemStore;
const FileStore = types.FileStore;
const Cache = types.Cache;
const transformStore = types.transformStore;
const SnapFiles = types.SnapFiles;

export {
  wrap,
  sync,
  urlTransport,
  serve,
  merge,
  object,
  watch,
  order,
  orderBy,
  groupBy,
  filter
};

export { Changes };
export { Replace, PathChange, Transport, MemStore, map };
export { FileStore, ChangeBuilder, Snapshot };
export { Cache };
export { transformStore };
export { SnapFiles };
