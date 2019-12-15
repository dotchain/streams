"use strict";

/* eslint-env mocha, browser */

import { expect } from "./expect.js";
import { Cache } from "../main.js";
import { sync, urlTransport, serve, transformStore } from "../main.js";
import { MemStore, Snapshot } from "../main.js";

describe("snapshot", () => {
  it("snapshots", async () => {
    let store = new MemStore();
    let xstore = transformStore(store, null, null);
    let fetch = fetchPipe((req, res) => serve(xstore, req, res));
    let xport = urlTransport("boo", fetch);
    let root = sync(new Cache(fakeLocalStorage()), xport, newID());
    root = root.replace("hello");
    root.replace("world");

    await xport.push();
    expect(store.ops.length).to.equal(2);

    const cache = { get: async (v, p, fn) => await fn() };
    let snap = new Snapshot(store, null, null, cache);

    expect((await await snap.get(0)).valueOf()).to.equal("hello");
    expect((await await snap.get(1)).valueOf()).to.equal("world");
  });

  it("errors out on non-existent parentID", async () => {
    let store = new MemStore();
    let xstore = transformStore(store, null, null);
    let fetch = fetchPipe((req, res) => serve(xstore, req, res));
    let xport = urlTransport("boo", fetch);
    let root = sync(new Cache(fakeLocalStorage()), xport, newID());
    root = root.replace("hello");
    root.replace("world");

    await xport.push();
    expect(store.ops.length).to.equal(2);

    const cache = { get: async (v, p, fn) => await fn() };
    let snap = new Snapshot(store, null, null, cache);

    let errMessage = null;
    try {
      await snap.get(1, "boo");
    } catch (e) {
      errMessage = e.message;
    }

    expect(errMessage).to.equal("snapshot parentID not found");
  });

  it("fetches snapshot with parentID", async () => {
    let store = new MemStore();
    let xstore = transformStore(store, null, null);
    let fetch = fetchPipe((req, res) => serve(xstore, req, res));
    let xport1 = urlTransport("boo", fetch);
    let xport2 = urlTransport("boo", fetch);
    let idgen = newID();
    let root1 = sync(new Cache(fakeLocalStorage()), xport1, idgen);
    let root2 = sync(new Cache(fakeLocalStorage()), xport2, idgen);

    root1 = root1.replace({});
    await xport1.push();

    await xport2.pull();
    root2 = root2.latest();

    // update root1 to {hello: 'world'} and root2 to {boo: 'hoo'}
    root1.get("hello").replace("world");
    await xport1.push();

    root2.get("boo").replace("hoo");
    await xport2.push();
    root2 = root2.latest();
    root2.boo.replace("hoot");
    await xport2.push();

    expect(store.ops.length).to.equal(4);
    const lastop = store.ops[3];

    const cache = { get: async (v, p, fn) => await fn() };
    let snap = new Snapshot(store, null, null, cache);
    const v = await snap.get(1, lastop.id);
    expect(JSON.parse(JSON.stringify(v))).to.deep.equal({
      hello: "world",
      boo: "hoot"
    });
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
