# streams

This repository contains a streams package which implements arbitrary
data sync for browser (or node) clients using an extremely simple and
mostly transparent API.

This uses *Operations Transformation* underneath to support multiple
collaborative clients but the specific API has been chosen with care
to make it dead simple to use.

## Documentation

A stream can be created by wrapping any object:

```js
// import {wrap} from "github.com/dotchain/streams/es6";

let s1 = wrap("hello");
```

For most practical purposes, the wrapped object works like the original object:

```js
// import {wrap} from "github.com/dotchain/streams/es6";

let s1 = wrap("hello");
expect(s1 + "world").to.equal("hello world");
```

In addition, wrapped objects support mutations methods, such as **replace**:

```js
// import {wrap} from "github.com/dotchain/streams/es6";

let s1 = wrap("hello");
let s2 = s1.replace("world");
expect("hello " + s2).to.equal("hello world");
```

Note that *replace* returns a new value leaving the original as is.
But all older versions of the object can obtain the latest value by
calling **latest**:

```js
// import {wrap} from "github.com/dotchain/streams/es6";

let s1 = wrap("hello");
let s2 = s1.replace("world");
expect("hello " + s1.latest()).to.equal("hello world");
```

## Roadmap

1. Minimal E2E implementation:
    - ~streams.wrap for string type only~
    - ~Only method supported by string type is replace()~
    - ~Only change type is Replace~
    - Simple transport (no merge/rebasing)
    - sync() implementation
    - In memory server
2. Local session state caching
3. Server persistence to files
4. More atomic types (bool, number, date)
5. Dict type
    - streams.wrap support
    - PathChange change type
    - fields accessible using dot notation
7. Collections
    - map, filter, dict, merge
6. Collaboration
    - merge support in change types
    - merge support in stream base class
    - merge support in streams.sync()
7. Branch merge support
8. Server DB support

