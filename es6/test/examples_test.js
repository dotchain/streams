"use strict";

import { expect } from "./expect.js";
import { wrap } from "../main.js";
import { merge } from "../main.js";
import { object } from "../main.js";
import { watch } from "../main.js";
import http from "http";
import fs from "fs";
import fetch from "node-fetch";
import { serve, urlTransport, sync } from "../main.js";
import { FileStore, Cache } from "../main.js";

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
  it("does mutations", async () => {
    // import {expect} from "./expect.js";
    // import {wrap} from "github.com/dotchain/streams/es6";

    let s1 = wrap("hello");
    let s2 = s1.replace("world");
    expect("hello " + s2).to.equal("hello world");
  });
  it("does mutations #1", async () => {
    // import {expect} from "./expect.js";
    // import {wrap} from "github.com/dotchain/streams/es6";

    let s1 = wrap("hello");
    let s2 = s1.replace("world");
    expect("" + s1.latest()).to.equal("" + s2);
  });
  it("does modifying hashes", async () => {
    // import {expect} from "./expect.js";
    // import {wrap} from "github.com/dotchain/streams/es6";

    let s1 = wrap({ hello: { world: "hey" } });
    let s2 = s1.hello.world.replace("world");
    expect(s2.valueOf()).to.equal("world");
    expect(s1.latest().hello.world.valueOf()).to.equal("world");
  });
  it("does modifying hashes #1", async () => {
    // import {expect} from "./expect.js";
    // import {wrap} from "github.com/dotchain/streams/es6";

    let s1 = wrap({ hello: { world: "hey" } });
    let s2 = s1.replacePath(["hello", "world"], "boo");
    expect(s1.latest().hello.world.valueOf()).to.equal("boo");
    expect(s2.hello.world.valueOf()).to.equal("boo");
  });
  it("does modifying hashes #2", async () => {
    // import {expect} from "./expect.js";
    // import {wrap} from "github.com/dotchain/streams/es6";

    let s1 = wrap({ hello: "world" });
    let s2 = s1.replacePath(["boo", "hoo"], "hoo");
    expect(s2.boo.hoo.valueOf()).to.equal("hoo");
    expect(s1.latest().boo.hoo.valueOf()).to.equal("hoo");
  });
  it("does modifying hashes #3", async () => {
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
  it("does mutations converge #1", async () => {
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
  it("does merge", async () => {
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
  it("does object", async () => {
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
  it("does network synchronization", async () => {
    // import http from "http";
    // import fs from "fs";
    // import fetch from "node-fetch";
    // import {serve, urlTransport, sync} from "github.com/dotchain/streams/es6";
    // import {FileStore, Cache} from "github.com/dotchain/streams/es6";

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
      let store = new FileStore("/tmp/ops.json", fs);
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
