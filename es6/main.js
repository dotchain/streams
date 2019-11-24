"use strict";

import { buildBasicTypes } from "./basic_types.js";
import { buildStream } from "./stream.js";
import { buildChildStream } from "./child_stream.js";
import { buildMerge } from "./merge.js";
import { buildObject } from "./object.js";
import { buildWatch } from "./watch.js";
import { buildOperation } from "./op.js";
import { buildPathChange } from "./path_change.js";
import { buildReplace } from "./replace.js";
import { buildChangeBuilder } from "./change_builder.js";
import { buildSync } from "./sync.js";
import { buildTransport } from "./transport.js";
import { buildWrap } from "./wrap.js";
import { buildServer } from "./server.js";
import { buildFileStore } from "./filestore_node.js";
import { buildCache } from "./cache_browser.js";

function build() {
  let types = {};
  buildBasicTypes(types);
  buildStream(types);
  buildChildStream(types);
  buildMerge(types);
  buildObject(types);
  buildWatch(types);
  buildOperation(types);
  buildPathChange(types);
  buildReplace(types);
  buildChangeBuilder(types);
  buildSync(types);
  buildTransport(types);
  buildWrap(types);
  buildCache(types);

  buildServer(types);
  buildFileStore(types);
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
const Replace = types.Replace;
const PathChange = types.PathChange;
const ChangeBuilder = types.ChangeBuilder;
const Transport = types.Transport;
const MemStore = types.MemStore;
const FileStore = types.FileStore;
const Cache = types.Cache;

export { wrap, sync, urlTransport, serve, merge, object, watch };
export { Replace, PathChange, Transport, MemStore };
export { FileStore, ChangeBuilder };
export { Cache };
