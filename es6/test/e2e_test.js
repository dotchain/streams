"use strict";

/* eslint-env mocha, browser */

import { expect } from "./expect.js";
import { Cache } from "../main.js";
import { sync, urlTransport, serve, transformStore } from "../main.js";
import { MemStore, Replace } from "../main.js";

describe("e2e piped", () => {
  it("writes and reads operations to the server", async () => {
    let store = new MemStore();
    let xstore = transformStore(store, null, null);
    let fetch = fetchPipe((req, res) => serve(xstore, req, res));
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
    let xstore = transformStore(store, null, null);
    let fetch = fetchPipe((req, res) => serve(xstore, req, res));
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
    let xstore = transformStore(store, null, null);
    let fetch = fetchPipe((req, res) => serve(xstore, req, res));
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
    expect(root.latest() + "").to.equal("world");
  });

  it("transforms operations: no conflicts", async () => {
    const store = new MemStore();
    const raw = new MemOpsCache();
    const xform = new MemOpsCache();
    const xstore = transformStore(store, raw, xform);
    const idgen = newID();
    const fetch = fetchPipe((req, res) => serve(xstore, req, res));
    const xport1 = urlTransport("boo", fetch);
    const xport2 = urlTransport("boo", fetch);
    let root1 = sync(new Cache(fakeLocalStorage()), xport1, idgen);
    let root2 = sync(new Cache(fakeLocalStorage()), xport2, idgen);

    // update root1
    root1 = root1.replace({ hello: "world" });
    root1 = root1.replacePath(["hello"], "boo");
    root1 = root1.replacePath(["hello"], "hoo");
    await xport1.push();
    await xport1.pull();

    // update root2 in parallel
    root2 = root2.replace({ hello2: "world" });
    root2 = root2.replacePath(["hello2"], "boo");
    root2 = root2.replacePath(["hello2"], "hoo");
    await xport2.push();
    await xport2.pull();

    // resync root1
    await xport1.pull();

    root1 = root1.latest();
    root2 = root2.latest();

    // validate both are converged
    expect(store.ops.length).to.equal(6);
    const expected = { hello2: "hoo" };
    expect(JSON.parse(JSON.stringify(root1))).to.deep.equal(expected);
    expect(JSON.parse(JSON.stringify(root2))).to.deep.equal(expected);

    // validate that the raw operations are the same as in the store
    for (let op of store.ops) {
      expect(raw.get(op.version, 1)[0]).to.deep.equal(op);
    }

    expect(JSON.stringify(xform.get(0, 6), null, 2)).to.equal(
      expectedSimpleXForm
    );
  });
});

const expectedSimpleXForm = `[
  {
    "xform": {
      "id": "1",
      "version": 0,
      "basis": -1,
      "parentID": null,
      "change": {
        "before": "",
        "after": {
          "hello": "world"
        }
      }
    },
    "merge": []
  },
  {
    "xform": {
      "id": "2",
      "version": 1,
      "basis": -1,
      "parentID": "1",
      "change": {
        "path": [
          "hello"
        ],
        "change": {
          "before": "world",
          "after": "boo"
        }
      }
    },
    "merge": []
  },
  {
    "xform": {
      "id": "3",
      "version": 2,
      "basis": -1,
      "parentID": "2",
      "change": {
        "path": [
          "hello"
        ],
        "change": {
          "before": "boo",
          "after": "hoo"
        }
      }
    },
    "merge": []
  },
  {
    "xform": {
      "id": "4",
      "version": 3,
      "basis": -1,
      "parentID": null,
      "change": {
        "before": {
          "hello": "hoo"
        },
        "after": {
          "hello2": "world"
        }
      }
    },
    "merge": [
      {
        "id": "1",
        "version": 0,
        "basis": -1,
        "parentID": null,
        "change": null
      },
      {
        "id": "2",
        "version": 1,
        "basis": -1,
        "parentID": "1",
        "change": null
      },
      {
        "id": "3",
        "version": 2,
        "basis": -1,
        "parentID": "2",
        "change": null
      }
    ]
  },
  {
    "xform": {
      "id": "5",
      "version": 4,
      "basis": -1,
      "parentID": "4",
      "change": {
        "path": [
          "hello2"
        ],
        "change": {
          "before": "world",
          "after": "boo"
        }
      }
    },
    "merge": [
      {
        "id": "1",
        "version": 0,
        "basis": -1,
        "parentID": null,
        "change": null
      },
      {
        "id": "2",
        "version": 1,
        "basis": -1,
        "parentID": "1",
        "change": null
      },
      {
        "id": "3",
        "version": 2,
        "basis": -1,
        "parentID": "2",
        "change": null
      }
    ]
  },
  {
    "xform": {
      "id": "6",
      "version": 5,
      "basis": -1,
      "parentID": "5",
      "change": {
        "path": [
          "hello2"
        ],
        "change": {
          "before": "boo",
          "after": "hoo"
        }
      }
    },
    "merge": [
      {
        "id": "1",
        "version": 0,
        "basis": -1,
        "parentID": null,
        "change": null
      },
      {
        "id": "2",
        "version": 1,
        "basis": -1,
        "parentID": "1",
        "change": null
      },
      {
        "id": "3",
        "version": 2,
        "basis": -1,
        "parentID": "2",
        "change": null
      }
    ]
  }
]`;

class MemOpsCache {
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
}

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
