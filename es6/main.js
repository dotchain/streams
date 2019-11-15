"use strict";

import { buildBasicTypes } from "./basic_types.js";
import { buildStream } from "./stream.js";
import { buildChildStream } from "./child_stream.js";
import { buildMerge } from "./merge.js";
import { buildOperation } from "./op.js";
import { buildPathChange } from "./path_change.js";
import { buildReplace } from "./replace.js";
import { buildSync } from "./sync.js";
import { buildTransport } from "./transport.js";
import { buildWrap } from "./wrap.js";
import { buildServer } from "./server.js";

function build() {
  let types = {};
  buildBasicTypes(types);
  buildStream(types);
  buildChildStream(types);
  buildMerge(types);
  buildOperation(types);
  buildPathChange(types);
  buildReplace(types);
  buildSync(types);
  buildTransport(types);
  buildWrap(types);

  buildServer(types);
  return types;
}

const types = build();
const wrap = types.wrap;
const sync = types.sync;
const urlTransport = types.urlTransport;
const serve = types.serve;
const merge = types.merge;
const Replace = types.Replace;
const PathChange = types.PathChange;
const Transport = types.Transport;
const MemStore = types.MemStore;

export { wrap, sync, urlTransport, serve, merge };
export { Replace, PathChange, Transport, MemStore };
