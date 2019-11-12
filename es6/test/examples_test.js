"use strict";

import { expect } from "chai";
import { wrap } from "../main.js";
import { unwrap } from "../main.js";
import http from "http";
import fs from "fs";
import fetch from "node-fetch";
import { serve } from "../main.js";
import { FileStore } from "../file/file.js";
import { Cache } from "../local_storage/cache.js";
import { urlTransport, sync } from "../main.js";

describe("examples from README.md", () => {
  it("does example 0", async () => {
    // import {expect} from "chai";
    // import {wrap} from "github.com/dotchain/streams/es6";
    // import {unwrap} from "github.com/dotchain/streams/es6";

    let s1 = wrap("hello");
    expect(unwrap(s1)).to.equal("hello");
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
    expect("" + s1.latest()).to.equal("" + s2);
  });
  it("does example 4", async () => {
    // import http from "http";
    // import fs from "fs";
    // import fetch from "node-fetch";
    // import {serve} from "github.com/dotchain/streams/es6";
    // import {FileStore} from "github.com/dotchain/streams/es6/file/file.js";
    // import {Cache} from "github.com/dotchain/streams/es6/local_storage/cache.js";
    // import {urlTransport, sync} from "github.com/dotchain/streams/es6";

    let server = startServer();
    let { root, xport } = startClient();

    // update root
    root.replace("hello");
    expect(root.latest() + "").to.equal("hello");

    // push the changes to the server
    await xport.push();

    // check that these are visible on another client
    let { root: root2, xport: xport2 } = startClient();
    await xport2.pull();
    expect(root2.latest() + "").to.equal("hello");

    // cleanup
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
      let ls = fakeLocalStorage(); // window.localStorage on browsers
      let root = sync(new Cache(ls), xport, () => {
        count++;
        return `${count}`;
      });
      return { root, xport };
    }

    function fakeLocalStorage() {
      let storage = {};
      return {
        setItem: (key, value) => {
          storage[key] = value + "";
        },
        getItem: key => storage[key]
      };
    }
  });
});
