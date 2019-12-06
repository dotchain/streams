# streams

[![Build Status](https://travis-ci.com/dotchain/streams.svg?branch=master)](https://travis-ci.com/dotchain/streams)
[![codecov](https://codecov.io/gh/dotchain/streams/branch/master/graph/badge.svg)](https://codecov.io/gh/dotchain/streams)

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
        1. [Replace](#replace)
        2. [Latest](#latest)
        3. [Modifying properties/fields](#modifying-properties-fields)
        4. [Modifying with replacePath](#modifying-with-replacepath)
        5. [Adding fields with replacePath](#adding-fields-with-replacepath)
        6. [Adding fields with .get](#adding-fields-with-get)
        7. [Deleting fields](#deleting-fields)
        8. [Mutations converge](#mutations-converge)
        9. [Last writer wins](#last-writer-wins)
    4. [Stream composition](#stream-composition)
        1. [Merging two objects](#merging-two-objects)
        2. [Merging with duplicate keys](#merging-with-duplicate-keys)
        3. [Modifying existing keys in merged streams](#modifying-existing-keys-in-merged-streams)
        4. [Adding new keys in merged streams](#adding-new-keys-in-merged-streams)
        5. [Deleting keys from a merged stream](#deleting-keys-from-a-merged-stream)
        6. [Delete resurfaces old keys](#delete-resurfaces-old-keys)
        7. [Uinsg object() for static shapes](#uinsg-object-for-static-shapes)
        8. [Modifying existing keys in an object() stream](#modifying-existing-keys-in-an-object-stream)
        9. [Watch](#watch)
    5. [Collections](#collections)
        1. [map](#map)
    6. [Network synchronization](#network-synchronization)
        1. [Standalone server](#standalone-server)
        2. [Browser example](#browser-example)
        3. [Server with local storage example](#server-with-local-storage-example)
    7. [Other basic types](#other-basic-types)
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
create *adhoc* streams as in these examples.

### Wrapping hashes

The wrapping works transparently for hashes as well.

```js
// import {expect} from "./expect.js";
// import {wrap} from "github.com/dotchain/streams/es6";

let s1 = wrap({hello: {boo: "hoo"}});
expect(s1.hello.boo + "t").to.equal("hoot");
```

### Mutations

#### Replace

All wrapped objects allow being **replaced** with  another value:

```js
// import {expect} from "./expect.js";
// import {wrap} from "github.com/dotchain/streams/es6";

let s1 = wrap("hello");
let s2 = s1.replace("world");
expect("hello " + s2).to.equal("hello world");
```

#### Latest

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

#### Modifying properties/fields

Fields can be modified via the dot notation:

```js
// import {expect} from "./expect.js";
// import {wrap} from "github.com/dotchain/streams/es6";

let s1 = wrap({hello: {world: "hey"}})
let s2 = s1.hello.world.replace("world");
expect(s2.valueOf()).to.equal("world");
expect(s1.latest().hello.world.valueOf()).to.equal("world");
```

#### Modifying with replacePath

The `replacePath` method is like `replace` except it takes a path
instead of using the dot notation:

```js
// import {expect} from "./expect.js";
// import {wrap} from "github.com/dotchain/streams/es6";

let s1 = wrap({hello: {world: "hey"}})
let s2 = s1.replacePath(["hello", "world"], "boo");
expect(s1.latest().hello.world.valueOf()).to.equal("boo");
expect(s2.hello.world.valueOf()).to.equal("boo");
```

#### Adding fields with replacePath

This is also a convenient way to set an inner field if that path doesn't exist:

```js
// import {expect} from "./expect.js";
// import {wrap} from "github.com/dotchain/streams/es6";

let s1 = wrap({hello: "world"})
let s2 = s1.replacePath(["boo", "hoo"], "hoo");
expect(s2.boo.hoo.valueOf()).to.equal("hoo");
expect(s1.latest().boo.hoo.valueOf()).to.equal("hoo");
```

#### Adding fields with .get

A field that does not exist can also be fetched using **get** which
maps to a wrapped `null` value, but implements `replace` for
convenience: 

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

#### Deleting fields

Fields can be deleted by replacing with null:

```js
// import {expect} from "./expect.js";
// import {wrap} from "github.com/dotchain/streams/es6";

let s1 = wrap({hello: "world"})
s1.hello.replace(null);

expect(s1.exists("hello")).to.equal(true);
expect(s1.latest().exists("hello")).to.equal(false);
expect(JSON.stringify(s1.latest())).to.equal("{}");

```

#### Mutations converge

Mutations automatically converge on a stream.  Note that using a
stream that is [synchronized](#network-synchronization) would mean
that this convergence happens across network clients: i.e. all clients
with this state automatically converge:

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

#### Last writer wins

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

#### Merging two objects

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

#### Merging with duplicate keys

When the same key is present in multiple streams, the last one wins:

```js
// import {expect} from "./expect.js";
// import {wrap} from "github.com/dotchain/streams/es6";
// import {merge} from "github.com/dotchain/streams/es6";

let s1 = wrap({hello: "world", ok: "computer"});
let s2 = wrap({hello: "goodbye", boo: "hoo"});
let s3 = merge([s1, s2]);

expect(s3.hello.valueOf()).to.equal("goodbye");
```

#### Modifying existing keys in merged streams

Modifying a key (or some path) correctly transfers those mutations to
the underlying streams.  

```js
// import {expect} from "./expect.js";
// import {wrap} from "github.com/dotchain/streams/es6";
// import {merge} from "github.com/dotchain/streams/es6";

let s1 = wrap({hello: "world"});
let s2 = wrap({boo: "hoo"});
let s3 = merge([s1, s2]);

s3.boo.replace("hoot");

expect(s2.latest().boo.valueOf()).to.equal("hoot");
```

#### Adding new keys in merged streams

When streams are merged, new keys always end up being added on the
last stream.

```js
// import {expect} from "./expect.js";
// import {wrap} from "github.com/dotchain/streams/es6";
// import {merge} from "github.com/dotchain/streams/es6";

let s1 = wrap({hello: "world"});
let s2 = wrap({boo: "hoo"});
let s3 = merge([s1, s2]);

s3.get("la la").replace("la di da");

expect(s2.latest()["la la"].valueOf()).to.equal("la di da");
```

#### Deleting keys from a merged stream

Deleting a key from a merged stream correctly deletes the right
underlying stream:

```js
// import {expect} from "./expect.js";
// import {wrap} from "github.com/dotchain/streams/es6";
// import {merge} from "github.com/dotchain/streams/es6";

let s1 = wrap({hello: "world"});
let s2 = wrap({boo: "hoo"});
let s3 = merge([s1, s2]);

s3.hello.replace(null);
expect(JSON.stringify(s1.latest())).to.equal("{}");

s3 = s3.latest();
expect(JSON.stringify(s3)).to.equal('{"boo":"hoo"}');

```

#### Delete resurfaces old keys

Deleting a key from a merged stream may surface an older key:

```js
// import {expect} from "./expect.js";
// import {wrap} from "github.com/dotchain/streams/es6";
// import {merge} from "github.com/dotchain/streams/es6";

let s1 = wrap({hello: "world", ok: "computer"});
let s2 = wrap({boo: "hoo", ok: "not a computer"});
let s3 = merge([s1, s2]);

expect(s3.ok.valueOf()).to.equal("not a computer");
s3.ok.replace(null);
s3 = s3.latest();
expect(s3.ok.valueOf()).to.equal("computer");

```


#### Uinsg object() for static shapes

Streams can also be combined to form static shapes using `object`:

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

#### Modifying existing keys in an object() stream

Static shapes do not allow adding or removing keys but modifying a key
(or some path) correctly transfers those mutations to the underlying
streams:

```js
// import {expect} from "./expect.js";
// import {wrap} from "github.com/dotchain/streams/es6";
// import {object} from "github.com/dotchain/streams/es6";

let s1 = wrap("world");
let s2 = object({hello: s1});
s2.hello.replace("goodbye");

expect(s1.latest().valueOf()).to.equal("goodbye");
expect(s2.latest().hello.valueOf()).to.equal("goodbye");

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

### Collections

Collections are represented as object hashes.  The typical collection
methods like `map`, `filter`, `group`, `sort` etc are implemented on
hashes.  Ordering happens through `forEachKey` calling the provided
callback in the right order.  There is no default order.

#### map

The `map` function calls the provided callback for each key and
returns a hash that has the values replaced with that of the provided
function.


```js
// import {expect} from "./expect.js";
// import {wrap} from "github.com/dotchain/streams/es6";
// import {map} from "github.com/dotchain/streams/es6";

// uppercase converts a string stream into upper case string stream
let uppercase = name => name.valueOf().toUpperCase();

let name = wrap({first: "joe", last: "schmoe"});
let mapped = map(name, uppercase);

expect(mapped.first.valueOf()).to.equal("JOE");
expect(mapped.last.valueOf()).to.equal("SCHMOE");
```


### Network synchronization

#### Standalone server

A standalone server is needed for clients to connect to.  The
following is an example of such a server which uses a file storage
mechanism (and properly serializes access to the file):

```
// import http from "http";
// import fs from "fs";
// import {serve} from "github.com/dotchain/streams/es6";
// import {FileStore} from "github.com/dotchain/streams/es6";

func startServer() {
  let store = new FileStore("/tmp/ops.json", fs);
  let server = http.createServer((req, res) => serve(store, req, res));
  server.listen(8042);
  return server;
}
```

#### Browser example

The following example illustrates a browser setup.  Note that this
example includes an embedded server but that's just there to make the
code testable.

The example also includes a fake local storage implementation -- a
browser set-up can just use `window.localStorage`

```js
// import http from "http";
// import fs from "fs";
// import fetch from "node-fetch";
// import {serve} from "github.com/dotchain/streams/es6";
// import {urlTransport} from "github.com/dotchain/streams/es6";
// import {sync} from "github.com/dotchain/streams/es6";
// import {FileStore} from "github.com/dotchain/streams/es6";
// import {Cache} from "github.com/dotchain/streams/es6";

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

function startClient() {
  let xport = urlTransport("http://localhost:8042/", fetch);
  let ls = fakeLocalStorage(); // window.localStorage on browsers
  let root = sync(new Cache(ls), xport, newID());
  return {root, xport};
}

function newID() {
  let count = 0;
  return () => {
     count ++;
     return `${count}`;
  }
}

function fakeLocalStorage() {
  let storage = {};
  return {
    setItem: (key, value) => { storage[key] = value + ""; },
    getItem: (key) => storage[key]
  }
}

function startServer() {
  let store = new FileStore("/tmp/ops.json", fs);
  let server = http.createServer((req, res) => serve(store, req, res));
  server.listen(8042);
  return server;
}

```

#### Server with local storage example

The browser example above can be adapted to a node-js client setup
very directly but a different use case is where the server uses
streams connected to a local file storage directly (maybe exposed via
REST api endpoints).

```js
// import fs from "fs";
// import {serve} from "github.com/dotchain/streams/es6";
// import {Transport} from "github.com/dotchain/streams/es6";
// import {sync} from "github.com/dotchain/streams/es6";
// import {FileStore} from "github.com/dotchain/streams/es6";
// import {Cache} from "github.com/dotchain/streams/es6";

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
fs.unlinkSync("/tmp/ops.json");

function startClient() {
  let xport = new Transport(new FileStore("/tmp/ops.json", fs));
  let ls = fakeLocalStorage(); // window.localStorage on browsers
  let root = sync(new Cache(ls), xport, newID());
  return {root, xport};
}

function newID() {
  let count = 0;
  return () => {
     count ++;
     return `${count}`;
  }
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
    - ~map~, filter
    - comprehensive tests
7. Composition
    - ~watch, object, merge~
8. ~Collaboration~
    - ~merge support in change types~
    - ~merge support in stream base class~
    - ~merge support in streams.sync()~
    - transformed operations
    - multiple tabs support
    - add merge tests
9. Branch merge support
10. Server DB support
11. Mutable collections support
    - map
    - filter
12. Mutable composition support
    - ~object~
    - ~merge~

