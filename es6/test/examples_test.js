"use strict";

import { expect } from "./expect.js";
import { wrap } from "../main.js";
import { merge } from "../main.js";
import { object } from "../main.js";
import { watch } from "../main.js";
import { map } from "../main.js";
import { orderBy } from "../main.js";
import { order } from "../main.js";
import { filter } from "../main.js";
import { groupBy } from "../main.js";
import http from "http";
import fs from "fs";
import fetch from "node-fetch";
import { serve } from "../main.js";
import { urlTransport } from "../main.js";
import { transformStore } from "../main.js";
import { sync } from "../main.js";
import { FileStore } from "../main.js";
import { Cache } from "../main.js";
import { Transport } from "../main.js";

describe("examples from README.md", () => {
  it("does wrapping and unwrapping", async () => {
    // import {expect} from "./expect.js";
    // import {wrap} from "github.com/dotchain/streams/es6";

    let s1 = wrap("hello");
    expect(s1.valueOf()).to.equal("hello");
  });
  it("does wrapping and unwrapping #1", async () => {
    // import {expect} from "./expect.js";
    // import {wrap} from "github.com/dotchain/streams/es6";

    let s1 = wrap("hello");
    expect(s1 + " world").to.equal("hello world");
  });
  it("does wrapping hashes", async () => {
    // import {expect} from "./expect.js";
    // import {wrap} from "github.com/dotchain/streams/es6";

    let s1 = wrap({ hello: { boo: "hoo" } });
    expect(s1.hello.boo + "t").to.equal("hoot");
  });
  it("does replace", async () => {
    // import {expect} from "./expect.js";
    // import {wrap} from "github.com/dotchain/streams/es6";

    let s1 = wrap("hello");
    let s2 = s1.replace("world");
    expect("hello " + s2).to.equal("hello world");
  });
  it("does latest", async () => {
    // import {expect} from "./expect.js";
    // import {wrap} from "github.com/dotchain/streams/es6";

    let s1 = wrap("hello");
    let s2 = s1.replace("world");
    expect("" + s1.latest()).to.equal("" + s2);
  });
  it("does modifying properties/fields", async () => {
    // import {expect} from "./expect.js";
    // import {wrap} from "github.com/dotchain/streams/es6";

    let s1 = wrap({ hello: { world: "hey" } });
    let s2 = s1.hello.world.replace("world");
    expect(s2.valueOf()).to.equal("world");
    expect(s1.latest().hello.world.valueOf()).to.equal("world");
  });
  it("does modifying with replacepath", async () => {
    // import {expect} from "./expect.js";
    // import {wrap} from "github.com/dotchain/streams/es6";

    let s1 = wrap({ hello: { world: "hey" } });
    let s2 = s1.replacePath(["hello", "world"], "boo");
    expect(s1.latest().hello.world.valueOf()).to.equal("boo");
    expect(s2.hello.world.valueOf()).to.equal("boo");
  });
  it("does adding fields with replacepath", async () => {
    // import {expect} from "./expect.js";
    // import {wrap} from "github.com/dotchain/streams/es6";

    let s1 = wrap({ hello: "world" });
    let s2 = s1.replacePath(["boo", "hoo"], "hoo");
    expect(s2.boo.hoo.valueOf()).to.equal("hoo");
    expect(s1.latest().boo.hoo.valueOf()).to.equal("hoo");
  });
  it("does adding fields with .get", async () => {
    // import {expect} from "./expect.js";
    // import {wrap} from "github.com/dotchain/streams/es6";

    let s1 = wrap({ hello: "world" });
    let inner = s1.get("boo").get("hoo");
    expect(inner.valueOf()).to.equal(null);

    s1.get("boo")
      .get("hoo")
      .replace("hoot");
    expect(s1.latest().boo.hoo.valueOf()).to.equal("hoot");
    expect(inner.latest().valueOf()).to.equal("hoot");
  });
  it("does deleting fields", async () => {
    // import {expect} from "./expect.js";
    // import {wrap} from "github.com/dotchain/streams/es6";

    let s1 = wrap({ hello: "world" });
    s1.hello.replace(null);

    expect(s1.exists("hello")).to.equal(true);
    expect(s1.latest().exists("hello")).to.equal(false);
    expect(JSON.stringify(s1.latest())).to.equal("{}");
  });
  it("does mutations converge", async () => {
    // import {expect} from "./expect.js";
    // import {wrap} from "github.com/dotchain/streams/es6";

    let s = wrap({ hello: "world", boo: "hoo" });

    // edit hello and boo separately on top of s
    s.hello.replace("World");
    s.boo.replace("Hoo");

    // now s.latest() would have the updated values of both
    s = s.latest();
    expect(s.hello.valueOf()).to.equal("World");
    expect(s.boo.valueOf()).to.equal("Hoo");
  });
  it("does last writer wins", async () => {
    // import {expect} from "./expect.js";
    // import {wrap} from "github.com/dotchain/streams/es6";

    let s = wrap({});

    // edit hello and boo separately on top of s
    s.get("hello").replace("World");
    s.get("hello").replace("Goodbye");

    // now s.latest() would have the updated values of both
    s = s.latest();
    expect(s.hello.valueOf()).to.equal("Goodbye");
  });
  it("does merging two objects", async () => {
    // import {expect} from "./expect.js";
    // import {wrap} from "github.com/dotchain/streams/es6";
    // import {merge} from "github.com/dotchain/streams/es6";

    let s1 = wrap({ hello: "world" });
    let s2 = wrap({ boo: "hoo" });
    let s3 = merge([s1, s2]);

    s2.boo.replace("hoot");

    expect(s3.latest().boo.valueOf()).to.equal("hoot");
    expect(s3.latest().hello.valueOf()).to.equal("world");
  });
  it("does merging with duplicate keys", async () => {
    // import {expect} from "./expect.js";
    // import {wrap} from "github.com/dotchain/streams/es6";
    // import {merge} from "github.com/dotchain/streams/es6";

    let s1 = wrap({ hello: "world", ok: "computer" });
    let s2 = wrap({ hello: "goodbye", boo: "hoo" });
    let s3 = merge([s1, s2]);

    expect(s3.hello.valueOf()).to.equal("goodbye");
  });
  it("does modifying existing keys in merged streams", async () => {
    // import {expect} from "./expect.js";
    // import {wrap} from "github.com/dotchain/streams/es6";
    // import {merge} from "github.com/dotchain/streams/es6";

    let s1 = wrap({ hello: "world" });
    let s2 = wrap({ boo: "hoo" });
    let s3 = merge([s1, s2]);

    s3.boo.replace("hoot");

    expect(s2.latest().boo.valueOf()).to.equal("hoot");
  });
  it("does adding new keys in merged streams", async () => {
    // import {expect} from "./expect.js";
    // import {wrap} from "github.com/dotchain/streams/es6";
    // import {merge} from "github.com/dotchain/streams/es6";

    let s1 = wrap({ hello: "world" });
    let s2 = wrap({ boo: "hoo" });
    let s3 = merge([s1, s2]);

    s3.get("la la").replace("la di da");

    expect(s2.latest()["la la"].valueOf()).to.equal("la di da");
  });
  it("does deleting keys from a merged stream", async () => {
    // import {expect} from "./expect.js";
    // import {wrap} from "github.com/dotchain/streams/es6";
    // import {merge} from "github.com/dotchain/streams/es6";

    let s1 = wrap({ hello: "world" });
    let s2 = wrap({ boo: "hoo" });
    let s3 = merge([s1, s2]);

    s3.hello.replace(null);
    expect(JSON.stringify(s1.latest())).to.equal("{}");

    s3 = s3.latest();
    expect(JSON.stringify(s3)).to.equal('{"boo":"hoo"}');
  });
  it("does delete resurfaces old keys", async () => {
    // import {expect} from "./expect.js";
    // import {wrap} from "github.com/dotchain/streams/es6";
    // import {merge} from "github.com/dotchain/streams/es6";

    let s1 = wrap({ hello: "world", ok: "computer" });
    let s2 = wrap({ boo: "hoo", ok: "not a computer" });
    let s3 = merge([s1, s2]);

    expect(s3.ok.valueOf()).to.equal("not a computer");
    s3.ok.replace(null);
    s3 = s3.latest();
    expect(s3.ok.valueOf()).to.equal("computer");
  });
  it("does uinsg object() for static shapes", async () => {
    // import {expect} from "./expect.js";
    // import {wrap} from "github.com/dotchain/streams/es6";
    // import {object} from "github.com/dotchain/streams/es6";

    let name1 = wrap("Joe");
    let name2 = wrap("Shmoe");
    let name = object({ first: name1, last: name2 });
    name1.replace("John");
    name2.replace("Doe");
    expect(name.latest().first.valueOf()).to.equal("John");
    expect(name.latest().last.valueOf()).to.equal("Doe");

    const expected = { first: "John", last: "Doe" };
    expect(JSON.stringify(name.latest())).to.equal(JSON.stringify(expected));
  });
  it("does modifying existing keys in an object() stream", async () => {
    // import {expect} from "./expect.js";
    // import {wrap} from "github.com/dotchain/streams/es6";
    // import {object} from "github.com/dotchain/streams/es6";

    let s1 = wrap("world");
    let s2 = object({ hello: s1 });
    s2.hello.replace("goodbye");

    expect(s1.latest().valueOf()).to.equal("goodbye");
    expect(s2.latest().hello.valueOf()).to.equal("goodbye");
  });
  it("does watch", async () => {
    // import {expect} from "./expect.js";
    // import {wrap} from "github.com/dotchain/streams/es6";
    // import {watch} from "github.com/dotchain/streams/es6";

    let name = wrap({ first: "joe", last: "schmoe" });
    let fullName = watch(name, name => name.first + " " + name.last);
    expect(fullName.valueOf()).to.equal("joe schmoe");

    name.first.replace("John");
    name.latest().last.replace("Doe");
    expect(fullName.latest().valueOf()).to.equal("John Doe");
  });
  it("does watch #1", async () => {
    // import {expect} from "./expect.js";
    // import {wrap} from "github.com/dotchain/streams/es6";
    // import {watch} from "github.com/dotchain/streams/es6";

    let mappings = wrap({ Richard: "Dick", Charles: "Chuck" });
    let name = wrap({ first: "Richard", last: "Feynman" });
    let nick = watch(name, name => mappings[name.first.valueOf()]);

    expect(nick.valueOf()).to.equal("Dick");
    mappings.Richard.replace("Rick");
    expect(nick.latest().valueOf()).to.equal("Rick");

    name.first.replace("Charles");
    expect(nick.latest().valueOf()).to.equal("Chuck");
  });
  it("does map", async () => {
    // import {expect} from "./expect.js";
    // import {wrap} from "github.com/dotchain/streams/es6";
    // import {map} from "github.com/dotchain/streams/es6";

    // uppercase converts a string stream into upper case string stream
    let uppercase = name => name.valueOf().toUpperCase();

    let name = wrap({ first: "joe", last: "schmoe" });
    let mapped = map(name, uppercase);

    expect(mapped.first.valueOf()).to.equal("JOE");
    expect(mapped.last.valueOf()).to.equal("SCHMOE");
  });
  it("does orderby", async () => {
    // import {expect} from "./expect.js";
    // import {wrap} from "github.com/dotchain/streams/es6";
    // import {orderBy} from "github.com/dotchain/streams/es6";

    const list = wrap({ one: { x: 2 }, two: { x: 1 } });
    const sorted = orderBy(list, (val, _key) => val.x);

    let keys = [];
    sorted.forEachKey(key => {
      keys.push(key);
    });
    expect(JSON.stringify(keys)).to.equal(`["two","one"]`);

    // updates remain sorted
    list.one.x.replace(-1);
    keys = [];
    sorted.latest().forEachKey(key => {
      keys.push(key);
    });
    expect(JSON.stringify(keys)).to.equal(`["one","two"]`);
  });
  it("does order", async () => {
    // import {expect} from "./expect.js";
    // import {wrap} from "github.com/dotchain/streams/es6";
    // import {order} from "github.com/dotchain/streams/es6";

    const list = wrap({ one: { x: 2 }, two: { x: 1 } });
    const sorted = order(list, (val1, val2, _1, _2) => val1.x - val2.x);

    let keys = [];
    sorted.forEachKey(key => {
      keys.push(key);
    });
    expect(JSON.stringify(keys)).to.equal(`["two","one"]`);

    // updates remain sorted
    list.one.x.replace(-1);
    keys = [];
    sorted.latest().forEachKey(key => {
      keys.push(key);
    });
    expect(JSON.stringify(keys)).to.equal(`["one","two"]`);
  });
  it("does filter", async () => {
    // import {expect} from "./expect.js";
    // import {wrap} from "github.com/dotchain/streams/es6";
    // import {filter} from "github.com/dotchain/streams/es6";

    const list = wrap({ one: { x: 2 }, two: { x: -1 } });
    const filtered = filter(list, (val, _key) => val.x > 0);

    expect(JSON.stringify(filtered)).to.equal(`{"one":{"x":2}}`);

    // updates work
    list.two.x.replace(5);
    expect(
      filtered
        .latest()
        .get("two")
        .get("x")
        .valueOf()
    ).to.equal(5);
  });
  it("does groupby", async () => {
    // import {expect} from "./expect.js";
    // import {wrap} from "github.com/dotchain/streams/es6";
    // import {groupBy} from "github.com/dotchain/streams/es6";

    const row1 = { x: 5, y: 23 };
    const row2 = { x: 5, y: 11 };
    const row3 = { x: 9, y: 6 };
    const table = wrap({ row1, row2, row3 });
    let grouped = groupBy(table, row => row.x);

    let g = { "5": { row1, row2 }, "9": { row3 } };
    expect(JSON.parse(JSON.stringify(grouped))).to.deep.equal(g);

    // updates work
    table.row2.x.replace(7);
    grouped = grouped.latest();
    g = { "5": { row1 }, "9": { row3 }, "7": { row2: { x: 7, y: 11 } } };
    expect(JSON.parse(JSON.stringify(grouped))).to.deep.equal(g);
  });
  it("does browser example", async () => {
    // import http from "http";
    // import fs from "fs";
    // import fetch from "node-fetch";
    // import {serve} from "github.com/dotchain/streams/es6";
    // import {urlTransport} from "github.com/dotchain/streams/es6";
    // import {transformStore} from "github.com/dotchain/streams/es6";
    // import {sync} from "github.com/dotchain/streams/es6";
    // import {FileStore} from "github.com/dotchain/streams/es6";
    // import {Cache} from "github.com/dotchain/streams/es6";

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

    function startClient() {
      let xport = urlTransport("http://localhost:8042/", fetch);
      let ls = fakeLocalStorage(); // window.localStorage on browsers
      let root = sync(new Cache(ls), xport, newID());
      return { root, xport };
    }

    function newID() {
      let count = 0;
      return () => {
        count++;
        return `${count}`;
      };
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

    function startServer() {
      let store = new FileStore("/tmp/ops.json", fs);
      let xstore = transformStore(store);
      let server = http.createServer((req, res) => serve(xstore, req, res));
      server.listen(8042);
      return server;
    }
  });
  it("does server with local storage example", async () => {
    // import fs from "fs";
    // import {serve} from "github.com/dotchain/streams/es6";
    // import {Transport} from "github.com/dotchain/streams/es6";
    // import {sync} from "github.com/dotchain/streams/es6";
    // import {FileStore} from "github.com/dotchain/streams/es6";
    // import {Cache} from "github.com/dotchain/streams/es6";

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
    fs.unlinkSync("/tmp/ops.json");

    function startClient() {
      let xport = new Transport(new FileStore("/tmp/ops.json", fs));
      let ls = fakeLocalStorage(); // window.localStorage on browsers
      let root = sync(new Cache(ls), xport, newID());
      return { root, xport };
    }

    function newID() {
      let count = 0;
      return () => {
        count++;
        return `${count}`;
      };
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
