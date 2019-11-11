"use strict";

import { expect } from "chai";
import { wrap } from "../main.js";
import http from "http";
import fs from "fs";
import fetch from "node-fetch";
import { serve } from "../main.js";
import { FileStore } from "../file/file.js";
import { MemCache, urlTransport, sync } from "../main.js";

describe("examples from README.md", () => {
  it("does example 0", async () => {
    // import {expect} from "chai";
    // import {wrap} from "github.com/dotchain/streams/es6";

    let s1 = wrap("hello");
  });
  it("does example 1", async () => {
    // import {expect} from "chai";
    // import {wrap} from "github.com/dotchain/streams/es6";

    let s1 = wrap("hello");
    expect(s1 + " world").to.equal("hello world");
  });
  it("does example 2", async () => {
    // import {expect} from "chai";
    // import {wrap} from "github.com/dotchain/streams/es6";

    let s1 = wrap("hello");
    let s2 = s1.replace("world");
    expect("hello " + s2).to.equal("hello world");
  });
  it("does example 3", async () => {
    // import {expect} from "chai";
    // import {wrap} from "github.com/dotchain/streams/es6";

    let s1 = wrap("hello");
    let s2 = s1.replace("world");
    expect("hello " + s1.latest()).to.equal("hello world");
  });
  it("does example 4", async () => {
    // import http from "http";
    // import fs from "fs";
    // import fetch from "node-fetch";
    // import {serve} from "github.com/dotchain/streams/es6";
    // import {FileStore} from "github.com/dotchain/streams/es6/file/file.js";
    // import {MemCache, urlTransport, sync} from "github.com/dotchain/streams/es6";

    let server = startServer();
    let { root, xport } = startClient();

    root.replace("hello");
    await xport.push();
    expect(root.latest() + "").to.equal("hello");

    let { root: root2, xport: xport2 } = startClient();
    await xport2.pull();
    expect(root2.latest() + "").to.equal("hello");
    server.close();
    fs.unlinkSync("/tmp/ops.json");

    function startServer() {
      let store = new FileStore("/tmp/ops.json");
      let server = http.createServer((req, res) => serve(store, req, res));
      server.listen(8042);
      return server;
    }

    function startClient() {
      let xport = urlTransport("http://localhost:8042/", fetch);
      let count = 0;
      let root = sync(new MemCache(), xport, () => {
        count++;
        return `${count}`;
      });
      return { root, xport };
    }
  });
});
