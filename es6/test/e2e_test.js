"use strict";

/* eslint-env mocha, browser */

import { expect } from "chai";
import { Cache } from "../local_storage/cache.js";
import { sync, urlTransport, serve } from "../main.js";
import { MemStore, Replace } from "../main.js";

describe("e2e piped", () => {
  it("writes and reads operations to the server", async () => {
    let store = new MemStore();
    let fetch = fetchPipe((req, res) => serve(store, req, res));
    let xport = urlTransport("boo", fetch);
    let root = sync(new Cache(fakeLocalStorage()), xport, newID());
    root = root.replace("hello");
    root = root.replace("world");

    await xport.push();
    expect(store.ops.length).to.equal(2);

    xport = urlTransport("boo", fetch);
    root = sync(new Cache(fakeLocalStorage()), xport, newID());
    await xport.pull();
    expect(root.latest() + "").to.equal("world");
  });

  it("merges op with null change", async () => {
    let store = new MemStore();
    let fetch = fetchPipe((req, res) => serve(store, req, res));
    let xport = urlTransport("boo", fetch);
    let root = sync(new Cache(fakeLocalStorage()), xport, newID());
    xport.write({
      id: "boo",
      version: -1,
      basis: -1,
      parentID: null,
      change: null
    });
    root.replace("hello");
    await xport.push();
    expect(store.ops.length).to.equal(2);
    expect(store.ops[0].change).to.equal(null);

    await xport.pull();
    expect(root.latest() + "").to.equal("hello");
  });

  it("merges op with non-null change", async () => {
    let store = new MemStore();
    let fetch = fetchPipe((req, res) => serve(store, req, res));
    let xport = urlTransport("boo", fetch);
    let root = sync(new Cache(fakeLocalStorage()), xport, newID());
    xport.write({
      id: "boo",
      version: -1,
      basis: -1,
      parentID: null,
      change: new Replace("", "hello")
    });
    root.replace("world");
    await xport.push();
    expect(store.ops.length).to.equal(2);

    await xport.pull();
    expect(root.latest() + "").to.equal("hello"); // should be "world"
  });
});

function newID() {
  let count = 0;
  return () => {
    count++;
    return "" + count;
  };
}

function fetchPipe(serve) {
  return (url, opts) =>
    new Promise((resolve, reject) => {
      let body = "";
      let req = {
        setEncoding() {},
        on(type, cb) {
          if (type === "data") {
            cb(opts.body);
          } else {
            cb();
          }
        }
      };
      let res = {
        statusCode: 200,
        write(chunk) {
          body += chunk;
        },
        end(rest) {
          body += rest || "";
          if (this.statusCode != 200) {
            reject({ json: () => JSON.parse(body) });
          } else {
            resolve({ json: () => JSON.parse(body) });
          }
        }
      };
      serve(req, res);
    });
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
