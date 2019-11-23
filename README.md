# streams

This repository contains a streams package which implements arbitrary
data sync for browser (or node) clients using an extremely simple and
mostly transparent API.

This uses *Operations Transformation* underneath to support multiple
collaborative clients but the specific API has been chosen with care
to make it dead simple to use.

## Contents
1. [Documentation](#documentation)
    1. [Wrapping and unwrapping](#wrapping-and-unwrapping)
    2. [Wrapping hashes](#wrapping-hashes)
    3. [Mutations](#mutations)
    4. [Modifying hashes](#modifying-hashes)
    5. [Mutations converge](#mutations-converge)
    6. [Stream composition](#stream-composition)
        1. [Merge](#merge)
        2. [Object](#object)
        3. [Watch](#watch)
    7. [Network synchronization](#network-synchronization)
    8. [Other basic types](#other-basic-types)
2. [Roadmap](#roadmap)

## Documentation

### Wrapping and unwrapping

A stream can be created by wrapping any object:

```js
// import {expect} from "./expect.js";
// import {wrap} from "github.com/dotchain/streams/es6";

let s1 = wrap("hello");
expect(s1.valueOf()).to.equal("hello");
```

For most practical purposes, the wrapped object works like the original object:

```js
// import {expect} from "./expect.js";
// import {wrap} from "github.com/dotchain/streams/es6";

let s1 = wrap("hello");
expect(s1 + " world").to.equal("hello world");
```

NOTE: Most applications need [network
synchronized](#network-synchronization) streams and do not typically
create *adhoc* streams.

### Wrapping hashes

The wrapping works transparently for hashes as well.

```js
// import {expect} from "./expect.js";
// import {wrap} from "github.com/dotchain/streams/es6";

let s1 = wrap({hello: {boo: "hoo"}});
expect(s1.hello.boo + "t").to.equal("hoot");
```

### Mutations

In addition, wrapped objects support mutations methods, such as **replace**:

```js
// import {expect} from "./expect.js";
// import {wrap} from "github.com/dotchain/streams/es6";

let s1 = wrap("hello");
let s2 = s1.replace("world");
expect("hello " + s2).to.equal("hello world");
```

Note that *replace* returns a new value leaving the original as is.
But all older versions of the object can obtain the latest value by
calling **latest**:

```js
// import {expect} from "./expect.js";
// import {wrap} from "github.com/dotchain/streams/es6";

let s1 = wrap("hello");
let s2 = s1.replace("world");
expect("" + s1.latest()).to.equal("" + s2);
```

### Modifying hashes

Replace works on hashes too:

```js
// import {expect} from "./expect.js";
// import {wrap} from "github.com/dotchain/streams/es6";

let s1 = wrap({hello: {world: "hey"}})
let s2 = s1.hello.world.replace("world");
expect(s2.valueOf()).to.equal("world");
expect(s1.latest().hello.world.valueOf()).to.equal("world");
```

A frequent operation for hashes is to replace a inner path but apply
that on the current object. This is done with **replacePath**

```js
// import {expect} from "./expect.js";
// import {wrap} from "github.com/dotchain/streams/es6";

let s1 = wrap({hello: {world: "hey"}})
let s2 = s1.replacePath(["hello", "world"], "boo");
expect(s1.latest().hello.world.valueOf()).to.equal("boo");
expect(s2.hello.world.valueOf()).to.equal("boo");
```

This is also a convenient way to set an inner field if that path doesn't exist:

```js
// import {expect} from "./expect.js";
// import {wrap} from "github.com/dotchain/streams/es6";

let s1 = wrap({hello: "world"})
let s2 = s1.replacePath(["boo", "hoo"], "hoo");
expect(s2.boo.hoo.valueOf()).to.equal("hoo");
expect(s1.latest().boo.hoo.valueOf()).to.equal("hoo");
```

Note that a field that does not exist can also be fetched using **get**:

```js
// import {expect} from "./expect.js";
// import {wrap} from "github.com/dotchain/streams/es6";

let s1 = wrap({hello: "world"})
let inner = s1.get("boo").get("hoo");
expect(inner.valueOf()).to.equal(null);

s1.get("boo").get("hoo").replace("hoot");
expect(s1.latest().boo.hoo.valueOf()).to.equal("hoot");
expect(inner.latest().valueOf()).to.equal("hoot");
```

### Mutations converge

Mutations automatically converge on a stream.  Note that using a
stream that is [synchronized](#network-synchronization) would mean
that this convergence happens across network clients: i.e. all clients
with this state automatically converge.

```js
// import {expect} from "./expect.js";
// import {wrap} from "github.com/dotchain/streams/es6";

let s = wrap({hello: "world", boo: "hoo"});

// edit hello and boo separately on top of s
s.hello.replace("World");
s.boo.replace("Hoo");

// now s.latest() would have the updated values of both
s = s.latest();
expect(s.hello.valueOf()).to.equal("World");
expect(s.boo.valueOf()).to.equal("Hoo");
```

When multiple mutations conflict, the **last writer** generally wins.

```js
// import {expect} from "./expect.js";
// import {wrap} from "github.com/dotchain/streams/es6";

let s = wrap({});

// edit hello and boo separately on top of s
s.get("hello").replace("World");
s.get("hello").replace("Goodbye");

// now s.latest() would have the updated values of both
s = s.latest();
expect(s.hello.valueOf()).to.equal("Goodbye");
```


### Stream composition

Streams can be combined to create more streams using the `merge`,
`object` and `watch` functions as well as the collection functions
like `map` and `filter`.

#### Merge

Two separate object streams can be combined with `merge`:


```js
// import {expect} from "./expect.js";
// import {wrap} from "github.com/dotchain/streams/es6";
// import {merge} from "github.com/dotchain/streams/es6";

let s1 = wrap({hello: "world"});
let s2 = wrap({boo: "hoo"});
let s3 = merge([s1, s2]);

s2.boo.replace("hoot");

expect(s3.latest().boo.valueOf()).to.equal("hoot");
expect(s3.latest().hello.valueOf()).to.equal("world");
```

#### Object

A set of streams can be used to create an object stream using `object`:

```js
// import {expect} from "./expect.js";
// import {wrap} from "github.com/dotchain/streams/es6";
// import {object} from "github.com/dotchain/streams/es6";

let name1 = wrap("Joe");
let name2 = wrap("Shmoe");
let name = object({first: name1, last: name2});
name1.replace("John");
name2.replace("Doe");
expect(name.latest().first.valueOf()).to.equal("John");
expect(name.latest().last.valueOf()).to.equal("Doe");

const expected = {first: "John", last: "Doe"};
expect(JSON.stringify(name.latest())).to.equal(JSON.stringify(expected));
```

#### Watch

The `watch` function can be used to apply a specific function to every
instance.  It acts a bit like `map` acts on collections:


```js
// import {expect} from "./expect.js";
// import {wrap} from "github.com/dotchain/streams/es6";
// import {watch} from "github.com/dotchain/streams/es6";

let name = wrap({first: "joe", last: "schmoe"});
let fullName = watch(name, name => name.first + " " + name.last);
expect(fullName.valueOf()).to.equal("joe schmoe");

name.first.replace("John");
name.latest().last.replace("Doe");
expect(fullName.latest().valueOf()).to.equal("John Doe");
```

The function passed to `watch` can produce a stream. This is useful
when joining two collections:


```js
// import {expect} from "./expect.js";
// import {wrap} from "github.com/dotchain/streams/es6";
// import {watch} from "github.com/dotchain/streams/es6";

let mappings = wrap({Richard: "Dick", Charles: "Chuck"})
let name = wrap({first: "Richard", last: "Feynman"})
let nick = watch(name, name => mappings[name.first.valueOf()]);

expect(nick.valueOf()).to.equal("Dick");
mappings.Richard.replace("Rick");
expect(nick.latest().valueOf()).to.equal("Rick");

name.first.replace("Charles");
expect(nick.latest().valueOf()).to.equal("Chuck");
```


### Network synchronization

The following example illustrates a client-server setup.

```js
// import http from "http";
// import fs from "fs";
// import fetch from "node-fetch";
// import {serve, urlTransport, sync} from "github.com/dotchain/streams/es6";
// import {FileStore, Cache} from "github.com/dotchain/streams/es6";

let server = startServer();
let {root, xport} = startClient();

// update root
root.replace("hello");
expect(root.latest() + "").to.equal("hello");

// push the changes to the server
await xport.push();

// check that these are visible on another client
let {root: root2, xport: xport2} = startClient();
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
     count ++;
     return `${count}`;
  });
  return {root, xport};
}

function fakeLocalStorage() {
  let storage = {};
  return {
    setItem: (key, value) => { storage[key] = value + ""; },
    getItem: (key) => storage[key]
  }
}

```

### Other basic types

Other standard types like **number**, **boolean**, **Date** or
**null** can be wrapped as well.  When wrapped, these do implement the
[valueOf](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/valueOf)
method, so callers can use that to unwrap the values.

**Date** is a little special in that the wrapped value gets serialized
to `{type: "date", value: <utc_milliseconds>}` instead of a human
readable ISO string.  `Unwrap` returns this value too (though
`valueOf` returns the native Date object).

## Roadmap

1. ~Minimal E2E implementation:~
    - ~streams.wrap for string type only~
    - ~Only method supported by string type is replace()~
    - ~Only change type is Replace~
    - ~Simple transport (no merge/rebasing)~
    - ~sync() implementation~
    - ~In memory server~
2. ~Server persistence to files~
3. ~Local session state caching~
4. ~More atomic types (bool, number, date)~
5. ~Dict type~
    - ~streams.wrap support~
    - ~PathChange change type~
    - ~fields accessible using dot notation~
6. Collections
    - map, filter
7. Composition
    - ~watch, object, merge~
8. ~Collaboration~
    - ~merge support in change types~
    - ~merge support in stream base class~
    - ~merge support in streams.sync()~
    - add merge tests
9. Branch merge support
10. Server DB support
11. Mutable collections support
    - map
    - filter
12. Mutable composition support
    - object
    - merge

